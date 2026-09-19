import { withSupabase } from '@supabase/server'

interface UpdateOperatorBody {
  operatorId: string
  fullName: string
  email?: string
  phoneNumber: string
  state: string
  district: string
  mandiId: string
  password?: string
}

const jsonError = (
  error: string,
  status = 500,
  details?: unknown
) =>
  Response.json(
    {
      success: false,
      error,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  )

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return jsonError('Method not allowed.', 405)
    }

    try {
      // 1. Identify the logged-in admin.
      const adminUserId = ctx.userClaims?.id

      if (!adminUserId) {
        return jsonError(
          'Authenticated administrator could not be identified.',
          401
        )
      }

      // 2. Verify admin role from the real profile table.
      const { data: adminProfile, error: adminProfileError } =
        await ctx.supabaseAdmin
          .from('profiles')
          .select('id, role')
          .eq('id', adminUserId)
          .maybeSingle()

      if (adminProfileError) {
        console.error(
          'admin-update-operator: admin profile lookup failed',
          adminProfileError
        )

        return jsonError(
          'Could not verify administrator permissions.',
          500,
          adminProfileError.message
        )
      }

      if (!adminProfile || adminProfile.role !== 'admin') {
        return jsonError(
          'Only admin users can update operators.',
          403
        )
      }

      // 3. Parse request body.
      let body: Partial<UpdateOperatorBody>

      try {
        body = (await req.json()) as Partial<UpdateOperatorBody>
      } catch {
        return jsonError(
          'Request body must contain valid JSON.',
          400
        )
      }

      const operatorId = body.operatorId?.trim() || ''
      const fullName = body.fullName?.trim() || ''
      const email = body.email?.trim().toLowerCase() || ''
      const phoneNumber = body.phoneNumber?.trim() || ''
      const state = body.state?.trim() || ''
      const district = body.district?.trim() || ''
      const mandiId = body.mandiId?.trim() || ''
      const password = body.password || ''

      if (
        !operatorId ||
        !fullName ||
        !phoneNumber ||
        !state ||
        !district ||
        !mandiId
      ) {
        return jsonError(
          'Operator ID, name, phone, state, district and mandi are required.',
          400
        )
      }

      if (email && !email.includes('@')) {
        return jsonError(
          'Please provide a valid email address.',
          400
        )
      }

      if (password && password.length < 8) {
        return jsonError(
          'Operator password must be at least 8 characters.',
          400
        )
      }

      // 4. Verify the selected mandi.
      const { data: mandi, error: mandiError } =
        await ctx.supabaseAdmin
          .from('procurement_centres')
          .select('id, name, code')
          .eq('id', mandiId)
          .maybeSingle()

      if (mandiError) {
        console.error(
          'admin-update-operator: mandi lookup failed',
          mandiError
        )

        return jsonError(
          'Failed to verify the selected procurement centre.',
          500,
          mandiError.message
        )
      }

      if (!mandi) {
        return jsonError(
          'Selected procurement centre was not found.',
          400
        )
      }

      // 5. Verify the target profile.
      const { data: operator, error: operatorError } =
        await ctx.supabaseAdmin
          .from('profiles')
          .select(
            'id, role, full_name, phone_number, state, district, mandi_id, updated_at'
          )
          .eq('id', operatorId)
          .maybeSingle()

      if (operatorError) {
        console.error(
          'admin-update-operator: operator lookup failed',
          operatorError
        )

        return jsonError(
          'Failed to load the operator profile.',
          500,
          operatorError.message
        )
      }

      if (!operator || operator.role !== 'operator') {
        return jsonError(
          'Operator account was not found.',
          404
        )
      }

      // 6. Enforce one operator per mandi.
      const { data: conflictingOperator, error: conflictError } =
        await ctx.supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'operator')
          .eq('mandi_id', mandiId)
          .neq('id', operatorId)
          .limit(1)
          .maybeSingle()

      if (conflictError) {
        console.error(
          'admin-update-operator: conflict check failed',
          conflictError
        )

        return jsonError(
          'Failed to verify existing mandi operator assignment.',
          500,
          conflictError.message
        )
      }

      if (conflictingOperator) {
        return jsonError(
          `${mandi.name} already has operator ${
            conflictingOperator.full_name || 'assigned'
          }.`,
          409
        )
      }

      // 7. Get the current Auth record.
      const {
        data: currentAuthUser,
        error: currentAuthUserError,
      } = await ctx.supabaseAdmin.auth.admin.getUserById(operatorId)

      if (currentAuthUserError || !currentAuthUser.user) {
        console.error(
          'admin-update-operator: Auth user lookup failed',
          currentAuthUserError
        )

        return jsonError(
          currentAuthUserError?.message ||
            'The operator Auth account could not be found.',
          404
        )
      }

      const previousProfile = {
        full_name: operator.full_name,
        phone_number: operator.phone_number,
        state: operator.state,
        district: operator.district,
        mandi_id: operator.mandi_id,
        updated_at: operator.updated_at,
      }

      const currentAuthRecord = currentAuthUser.user

      // 8. Update the public profile FIRST.
      // If Auth update fails, we can safely restore the old profile.
      const { data: updatedProfile, error: profileUpdateError } =
        await ctx.supabaseAdmin
          .from('profiles')
          .update({
            full_name: fullName,
            phone_number: phoneNumber,
            state,
            district,
            mandi_id: mandiId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', operatorId)
          .select(
            'id, full_name, phone_number, state, district, mandi_id'
          )
          .maybeSingle()

      if (profileUpdateError || !updatedProfile) {
        console.error(
          'admin-update-operator: profile update failed',
          profileUpdateError
        )

        return jsonError(
          'Operator profile update failed.',
          500,
          profileUpdateError?.message ||
            'Profile row could not be updated.'
        )
      }

      // 9. Update Auth credentials only when admin supplied them.
      const newMetadata = {
        ...(currentAuthRecord.user_metadata || {}),
        full_name: fullName,
        phone_number: phoneNumber,
        state,
        district,
        role: 'operator',
        mandi_id: mandiId,
      }

      const authUpdates = {
        user_metadata: newMetadata,
        ...(email
          ? {
              email,
              email_confirm: true,
            }
          : {}),
        ...(password ? { password } : {}),
      }

      const {
        data: updatedAuthUser,
        error: authUpdateError,
      } = await ctx.supabaseAdmin.auth.admin.updateUserById(
        operatorId,
        authUpdates
      )

      if (authUpdateError || !updatedAuthUser.user) {
        console.error(
          'admin-update-operator: Auth update failed',
          authUpdateError
        )

        // Restore the profile because credentials did not update.
        const { error: rollbackError } =
          await ctx.supabaseAdmin
            .from('profiles')
            .update(previousProfile)
            .eq('id', operatorId)

        if (rollbackError) {
          console.error(
            'admin-update-operator: profile rollback failed',
            rollbackError
          )

          return jsonError(
            'Auth credential update failed and the profile rollback also failed.',
            500,
            {
              authError:
                authUpdateError?.message ||
                'Auth update failed.',
              rollbackError: rollbackError.message,
            }
          )
        }

        return jsonError(
          authUpdateError?.message ||
            'Failed to update operator Auth account.',
          400
        )
      }

      console.log(
        'admin-update-operator: success',
        {
          operatorId,
          mandiId,
          emailChanged: Boolean(email),
          passwordChanged: Boolean(password),
        }
      )

      return Response.json({
        success: true,
        operator: {
          id: updatedProfile.id,
          fullName: updatedProfile.full_name,
          email: updatedAuthUser.user.email ||
            currentAuthRecord.email ||
            null,
          phoneNumber: updatedProfile.phone_number,
          state: updatedProfile.state,
          district: updatedProfile.district,
          mandiId: updatedProfile.mandi_id,
          mandiName: mandi.name,
          mandiCode: mandi.code,
        },
      })
    } catch (error) {
      console.error(
        'admin-update-operator: unexpected error',
        error
      )

      return jsonError(
        error instanceof Error
          ? error.message
          : 'Unexpected error while updating operator.',
        500
      )
    }
  }),
}
