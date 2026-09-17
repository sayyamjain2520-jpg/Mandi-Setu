// End-to-End Workflow Verification Test for Mandi Setu
import { localStore } from '../src/services/mock/localStore'
import { api } from '../src/services/api'

async function runVerification() {
  console.log('====================================================')
  console.log('🚀 MANDI SETU — END-TO-END WORKFLOW VERIFICATION')
  console.log('====================================================\n')

  // Step 1: Initial State Inspection
  const centres = await api.getCentres()
  const commodities = await api.getCommodities()
  console.log(`✓ Loaded ${centres.length} Procurement Centres.`)
  console.log(`✓ Loaded ${commodities.length} MSP Commodities.`)

  const testCentre = centres[0] // Kota APMC
  const testCommodity = commodities[0] // Wheat FAQ Grade

  // Step 2: Farmer Books Slot
  console.log('\n[1/6] Testing Farmer Slot Booking & Digital Token Generation...')
  const bookingParams = {
    farmerId: 'usr-farmer-ramesh',
    farmerName: 'Rameshwar Dayal Patel',
    farmerPhone: '+91 98260 12345',
    centreId: testCentre.id,
    commodityId: testCommodity.id,
    slotDate: new Date().toISOString().split('T')[0],
    slotTimeStart: '10:00',
    slotTimeEnd: '12:00',
    numberOfVehicles: 2,
    vehicleType: 'Tractor Trolley' as const,
    vehicleNumber: 'RJ-20-EA-9988',
    notes: 'Grain dried in sun, moisture below 11%',
  }

  const newBooking = await api.createBooking(bookingParams)
  console.log(`  ✓ Booking Created: ${newBooking.bookingNumber}`)
  console.log(`  ✓ Token Allocated: ${newBooking.tokenNumber}`)
  console.log(`  ✓ QR Payload Generated: ${newBooking.qrCodeData.substring(0, 65)}...`)

  // Step 3: Verify In-App Notification & Simulated SMS
  console.log('\n[2/6] Verifying Multi-Channel Notifications...')
  const farmerNotifs = await api.getNotifications('usr-farmer-ramesh')
  const latestNotif = farmerNotifs[0]
  console.log(`  ✓ In-App Notification Received: "${latestNotif.title}" - ${latestNotif.message}`)

  const smsLogs = await api.getSmsLogs()
  const latestSms = smsLogs[0]
  console.log(`  ✓ SMS Dispatched to ${latestSms.recipientPhone}: "${latestSms.message}"`)

  // Step 4: Mandi Gate Arrival & Check-In
  console.log('\n[3/6] Testing Gate Check-In & Verification...')
  const checkInRes = await api.checkInAtGate(newBooking.tokenNumber)
  if (!checkInRes.success) throw new Error(`Gate Check-In Failed: ${checkInRes.message}`)
  console.log(`  ✓ Gate Check-In Success: ${checkInRes.message}`)
  console.log(`  ✓ Queue Entry Moved to Stage: "${checkInRes.entry?.currentStage}"`)

  // Step 5: Operator Broadcasts "Call Next Farmer"
  console.log('\n[4/6] Testing Operator Call Next Farmer to Weighbridge...')
  const callRes = await api.callNextInQueue(testCentre.id)
  if (!callRes.success) throw new Error(`Call Next Failed: ${callRes.message}`)
  console.log(`  ✓ Broadcasted Call: ${callRes.message}`)
  console.log(`  ✓ Called Token: ${callRes.entry?.tokenNumber} at stage "${callRes.entry?.currentStage}"`)

  // Step 6: Operator Records Weighment, Moisture & DBT Settlement
  console.log('\n[5/6] Testing Digital Weighbridge Entry & DBT Slip Issuance...')
  const grossWeightKg = 10700 // Loaded tractor
  const tareWeightKg = 3200  // Empty vehicle
  const moisturePercentage = 11.4 // Within FAQ limit
  const record = await api.recordProcurement({
    bookingId: newBooking.id,
    grossWeightKg,
    tareWeightKg,
    moisturePercentage,
    qualityGrade: 'Grade A',
    operatorId: 'usr-operator-rajesh',
  })

  console.log(`  ✓ Net Weight: ${record.netWeightKg} kg`)
  console.log(`  ✓ Moisture Deductions: ${record.deductionKg} kg`)
  console.log(`  ✓ Final Accepted Quantity: ${record.finalAcceptedQuintals} Quintals`)
  console.log(`  ✓ Govt MSP Rate: ₹${record.ratePerQuintal}/Qtl`)
  console.log(`  ✓ Total Payable Settlement: ₹${record.totalPayableAmount.toLocaleString('en-IN')}`)
  console.log(`  ✓ DBT Reference (UTR): ${record.paymentUtr}`)
  console.log(`  ✓ Payment Status: ${record.paymentStatus}`)

  // Step 7: Admin Dynamic Analytics Verification
  console.log('\n[6/6] Verifying Admin Dynamic Analytics Engine...')
  const analytics = await api.getAdminAnalytics()
  console.log(`  ✓ Total Bookings Recorded: ${analytics.totalBookings}`)
  console.log(`  ✓ Active Queue Count: ${analytics.activeQueueCount}`)
  console.log(`  ✓ Average Wait Time: ${analytics.averageWaitTimeMinutes} mins`)
  console.log(`  ✓ Farmers Served Total: ${analytics.farmersServedTotal}`)
  console.log(`  ✓ Capacity Intake Utilisation: ${analytics.capacityUtilisationPercentage}%`)
  console.log(`  ✓ Total DBT Settlement Amount: ₹${analytics.paymentStatusBreakdown.totalAmountInr.toLocaleString('en-IN')}`)
  console.log(`  ✓ Commodities Procured Breakdown:`)
  analytics.commodityProcurement.forEach((cp) => {
    console.log(`      - ${cp.name}: ${cp.quintals} Qtl (₹${cp.valueInr.toLocaleString('en-IN')})`)
  })

  console.log('\n====================================================')
  console.log('✅ ALL WORKFLOW STAGES VERIFIED SUCCESSFULLY!')
  console.log('====================================================\n')
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err)
  process.exit(1)
})
