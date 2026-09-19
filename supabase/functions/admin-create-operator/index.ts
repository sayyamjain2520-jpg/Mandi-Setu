import { withSupabase } from '@supabase/server'

interface CreateOperatorBody {
  fullName: string
  email: string
  phoneNumber: string
  state: string
  district: string
  mandiId: string
  password: string
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }

    try {
      // ----------------------------------------------------
      // 1. VERIFY CURRENT USER IS ADMIN
      // ----------------------------------------------------
      const { data: adminProfile, error: adminProfileError } =
        await ctx.supabase
          .from('profiles')
          .select('role')
          .eq('id', ctx.userClaims?.id)
          .maybeSingle()

      if (adminProfileError) {
        return Response.json(
          { error: adminProfileError.message },
          { status: 500 }
        )
      }

      if (adminProfile?.role !== 'admin') {
        return Response.json(
          { error: 'Only admin users can create operators.' },
          { status: 403 }
        )
      }

      // ----------------------------------------------------
      // 2. READ REQUEST BODY
      // ----------------------------------------------------
      const body = (await req.json()) as Partial<CreateOperatorBody>

      const fullName = body.fullName?.trim() || ''
      const email = body.email?.trim().toLowerCase() || ''
      const phoneNumber = body.phoneNumber?.trim() || ''
      const state = body.state?.trim() || ''
      const district = body.district?.trim() || ''
      const mandiId = body.mandiId?.trim() || ''
      const password = body.password || ''

      // ----------------------------------------------------
      // 3. VALIDATE INPUT
      // ----------------------------------------------------
      if (
        !fullName ||
        !email ||
        !phoneNumber ||
        !state ||
        !district ||
        !mandiId ||
        !password
      ) {
        return Response.json(
          { error: 'All operator fields are required.' },
          { status: 400 }
        )
      }

      if (password.length < 8) {
        return Response.json(
          {
            error:
              'Operator password must be at least 8 characters.',
          },
          { status: 400 }
        )
      }

      // ----------------------------------------------------
      // 4. VERIFY MANDI EXISTS
      // ----------------------------------------------------
      const { data: mandi, error: mandiError } = await ctx.supabase
        .from('procurement_centres')
        .select('id, name, code')
        .eq('id', mandiId)
        .maybeSingle()

      if (mandiError) {
        return Response.json(
          { error: mandiError.message },
          { status: 500 }
        )
      }

      if (!mandi) {
        return Response.json(
          {
            error:
              'Selected procurement centre was not found.',
          },
          { status: 400 }
        )
      }

      // ----------------------------------------------------
      // 5. CREATE SUPABASE AUTH USER
      // ----------------------------------------------------
      const {
        data: createdUser,
        error: createUserError,
      } = await ctx.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,

        user_metadata: {
          full_name: fullName,
          phone_number: phoneNumber,
          state,
          district,
          role: 'operator',
          mandi_id: mandiId,
        },
      })

      if (createUserError || !createdUser.user) {
        return Response.json(
          {
            error:
              createUserError?.message ||
              'Failed to create operator account.',
          },
          { status: 400 }
        )
      }

      const operatorId = createdUser.user.id

      // ----------------------------------------------------
      // 6. ENSURE PROFILE EXISTS
      // ----------------------------------------------------
      const { error: profileError } =
        await ctx.supabaseAdmin
          .from('profiles')
          .upsert(
            {
              id: operatorId,
              role: 'operator',
              full_name: fullName,
              phone_number: phoneNumber,
              state,
              district,
              mandi_id: mandiId,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'id',
            }
          )

      // ----------------------------------------------------
      // 7. ROLLBACK AUTH USER IF PROFILE CREATION FAILS
      // ----------------------------------------------------
      if (profileError) {
        await ctx.supabaseAdmin.auth.admin.deleteUser(
          operatorId
        )

        return Response.json(
          {
            error:
              `Operator profile creation failed: ` +
              profileError.message,
          },
          { status: 500 }
        )
      }

      // ----------------------------------------------------
      // 8. RETURN SUCCESS
      // ----------------------------------------------------
      return Response.json({
        success: true,

        operator: {
          id: operatorId,
          fullName,
          email,
          phoneNumber,
          state,
          district,
          mandiId,
          mandiName: mandi.name,
          mandiCode: mandi.code,
        },
      })
    } catch (error) {
      console.error(
        'admin-create-operator error:',
        error
      )

      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Unexpected error while creating operator.',
        },
        { status: 500 }
      )
    }
  }),
}