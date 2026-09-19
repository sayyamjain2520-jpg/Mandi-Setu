export type Locale =
  | 'en'
  | 'hi'
  | 'mr'
  | 'gu'
  | 'te'
  | 'ta'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  te: 'తెలుగు',
  ta: 'தமிழ்',
}

export const translations: Record<
  Locale,
  Record<string, string>
> = {
  /* ===================================================== */
  /* ENGLISH                                               */
  /* ===================================================== */

  en: {
    appTagline: 'Smart Procurement & Real-Time Queue',
    govtBadge: 'Govt of India APMC',
    switchRole: 'Switch Role View',

    roleFarmer: 'Farmer App',
    roleOperator: 'Mandi Operator',
    roleAdmin: 'Admin Console',

    navHome: 'Home',
    navCentres: 'Centres',
    navBookSlot: 'Book Slot',
    navMyToken: 'My Token',
    navPayments: 'Payments',

    welcomeGreeting: 'Namaste',

    heroBadge: 'Smart procurement platform',
    heroTitle: 'Plan your mandi visit with confidence.',
    heroDesc:
      'Book a slot, get a digital token, follow your queue live, and keep your procurement record in one place.',

    bookProcurementSlot: 'Book Procurement Slot',
    exploreMandis: 'Explore Mandis',

    activeBooking: 'Active booking',
    queueStatus: 'Queue status',
    calledToGate: 'Called to gate now',
    minWait: 'min wait',
    slotConfirmed: 'Slot confirmed',

    quickActions: 'Quick actions',
    quickActionsTitle: 'Everything you need, one tap away',

    bookSlot: 'Book Slot',
    reserveMandiVisit: 'Reserve your mandi visit.',

    myToken: 'My Token',
    openPassQueue: 'Open pass and live queue.',

    mandiCentres: 'Mandi Centres',
    capacityTimingsSlots: 'Capacity, timings and slots.',

    payments: 'Payments',
    procurementDbtRecords: 'Procurement and DBT records.',

    liveMsp: 'Live MSP',
    currentProcurementRates:
      'Current procurement reference rates',
    officialRates:
      'Official rates available in your Mandi Setu commodity catalogue.',
    updatedFromLiveData: 'Updated from live data',

    planBeforeTravel: 'Plan before you travel',
    checkSlotsQueue:
      'Check slots and queue status before leaving for the mandi.',

    transparentQueue: 'Transparent queue',
    seePositionStage:
      'See your position, stage and estimated waiting time live.',

    digitalRecords: 'Digital records',
    keepRecords:
      'Keep procurement, weighment and payment records in one place.',

    readyNextVisit: 'Ready for your next mandi visit?',
    pickSlot:
      'Pick a slot that matches your schedule and avoid unnecessary waiting.',
    bookASlot: 'Book a Slot',

    standardGrade: 'Standard grade',
    quintal: 'Qtl',

    loginLoading: 'Loading Mandi Setu...',
    verifyingAccount: 'Verifying your account',
  },

  /* ===================================================== */
  /* HINDI                                                 */
  /* ===================================================== */

  hi: {
    appTagline: 'स्मार्ट खरीद और रीयल-टाइम कतार',
    govtBadge: 'भारत सरकार APMC',
    switchRole: 'भूमिका बदलें',

    roleFarmer: 'किसान ऐप',
    roleOperator: 'मंडी ऑपरेटर',
    roleAdmin: 'प्रशासक',

    navHome: 'होम',
    navCentres: 'केंद्र',
    navBookSlot: 'स्लॉट बुक करें',
    navMyToken: 'मेरा टोकन',
    navPayments: 'भुगतान',

    welcomeGreeting: 'नमस्ते',

    heroBadge: 'स्मार्ट खरीद प्लेटफॉर्म',
    heroTitle: 'अपनी मंडी यात्रा की तैयारी भरोसे के साथ करें।',
    heroDesc:
      'स्लॉट बुक करें, डिजिटल टोकन प्राप्त करें, अपनी कतार लाइव देखें और खरीद का रिकॉर्ड एक ही जगह रखें।',

    bookProcurementSlot: 'खरीद स्लॉट बुक करें',
    exploreMandis: 'मंडियां देखें',

    activeBooking: 'सक्रिय बुकिंग',
    queueStatus: 'कतार स्थिति',
    calledToGate: 'अभी गेट पर बुलाया गया',
    minWait: 'मिनट प्रतीक्षा',
    slotConfirmed: 'स्लॉट कन्फर्म है',

    quickActions: 'त्वरित कार्य',
    quickActionsTitle: 'जरूरी सभी सुविधाएं एक टैप दूर',

    bookSlot: 'स्लॉट बुक करें',
    reserveMandiVisit: 'अपनी मंडी यात्रा रिज़र्व करें।',

    myToken: 'मेरा टोकन',
    openPassQueue: 'पास और लाइव कतार देखें।',

    mandiCentres: 'मंडी केंद्र',
    capacityTimingsSlots: 'क्षमता, समय और स्लॉट देखें।',

    payments: 'भुगतान',
    procurementDbtRecords: 'खरीद और DBT रिकॉर्ड देखें।',

    liveMsp: 'लाइव MSP',
    currentProcurementRates: 'वर्तमान खरीद संदर्भ दरें',
    officialRates:
      'आपके Mandi Setu कमोडिटी कैटलॉग में उपलब्ध आधिकारिक दरें।',
    updatedFromLiveData: 'लाइव डेटा से अपडेट किया गया',

    planBeforeTravel: 'यात्रा से पहले योजना बनाएं',
    checkSlotsQueue:
      'मंडी जाने से पहले स्लॉट और कतार की स्थिति जांचें।',

    transparentQueue: 'पारदर्शी कतार',
    seePositionStage:
      'अपनी स्थिति, चरण और अनुमानित प्रतीक्षा समय लाइव देखें।',

    digitalRecords: 'डिजिटल रिकॉर्ड',
    keepRecords:
      'खरीद, तौल और भुगतान के रिकॉर्ड एक ही जगह रखें।',

    readyNextVisit: 'अगली मंडी यात्रा के लिए तैयार हैं?',
    pickSlot:
      'अपनी सुविधा के अनुसार स्लॉट चुनें और अनावश्यक प्रतीक्षा से बचें।',
    bookASlot: 'स्लॉट बुक करें',

    standardGrade: 'मानक ग्रेड',
    quintal: 'क्विंटल',

    loginLoading: 'मंडी सेतु लोड हो रहा है...',
    verifyingAccount: 'आपके खाते की पुष्टि की जा रही है',
  },

  /* ===================================================== */
  /* MARATHI                                               */
  /* ===================================================== */

  mr: {
    appTagline: 'स्मार्ट खरेदी आणि रिअल-टाइम रांग',
    govtBadge: 'भारत सरकार APMC',
    switchRole: 'भूमिका बदला',

    roleFarmer: 'शेतकरी ॲप',
    roleOperator: 'मंडी ऑपरेटर',
    roleAdmin: 'प्रशासक',

    navHome: 'मुख्यपृष्ठ',
    navCentres: 'केंद्रे',
    navBookSlot: 'स्लॉट बुक करा',
    navMyToken: 'माझा टोकन',
    navPayments: 'देयके',

    welcomeGreeting: 'नमस्कार',

    heroBadge: 'स्मार्ट खरेदी प्लॅटफॉर्म',
    heroTitle: 'तुमच्या मंडई भेटीची आत्मविश्वासाने योजना करा.',
    heroDesc:
      'स्लॉट बुक करा, डिजिटल टोकन मिळवा, रांग थेट पहा आणि खरेदीची नोंद एका ठिकाणी ठेवा.',

    bookProcurementSlot: 'खरेदी स्लॉट बुक करा',
    exploreMandis: 'मंडई पहा',

    activeBooking: 'सक्रिय बुकिंग',
    queueStatus: 'रांग स्थिती',
    calledToGate: 'आता गेटवर बोलावले आहे',
    minWait: 'मिनिटे प्रतीक्षा',
    slotConfirmed: 'स्लॉट निश्चित आहे',

    quickActions: 'जलद कृती',
    quickActionsTitle: 'तुम्हाला आवश्यक सर्व काही एका टॅपवर',

    bookSlot: 'स्लॉट बुक करा',
    reserveMandiVisit: 'तुमची मंडई भेट आरक्षित करा.',

    myToken: 'माझा टोकन',
    openPassQueue: 'पास आणि थेट रांग पहा.',

    mandiCentres: 'मंडई केंद्रे',
    capacityTimingsSlots: 'क्षमता, वेळ आणि स्लॉट पहा.',

    payments: 'देयके',
    procurementDbtRecords: 'खरेदी आणि DBT नोंदी पहा.',

    liveMsp: 'लाइव्ह MSP',
    currentProcurementRates: 'सध्याचे खरेदी संदर्भ दर',
    officialRates:
      'तुमच्या Mandi Setu कमोडिटी कॅटलॉगमधील अधिकृत दर.',
    updatedFromLiveData: 'थेट डेटामधून अपडेट केले',

    planBeforeTravel: 'प्रवासापूर्वी योजना करा',
    checkSlotsQueue:
      'मंडईला जाण्यापूर्वी स्लॉट आणि रांगेची स्थिती तपासा.',

    transparentQueue: 'पारदर्शक रांग',
    seePositionStage:
      'तुमची स्थिती, टप्पा आणि अंदाजे प्रतीक्षा वेळ थेट पहा.',

    digitalRecords: 'डिजिटल नोंदी',
    keepRecords:
      'खरेदी, वजन आणि देयकांच्या नोंदी एका ठिकाणी ठेवा.',

    readyNextVisit: 'तुमच्या पुढील मंडई भेटीसाठी तयार आहात?',
    pickSlot:
      'तुमच्या वेळेनुसार स्लॉट निवडा आणि अनावश्यक प्रतीक्षा टाळा.',
    bookASlot: 'स्लॉट बुक करा',

    standardGrade: 'मानक दर्जा',
    quintal: 'क्विंटल',

    loginLoading: 'मंडी सेतु लोड होत आहे...',
    verifyingAccount: 'तुमच्या खात्याची पडताळणी केली जात आहे',
  },

  /* ===================================================== */
  /* GUJARATI                                              */
  /* ===================================================== */

  gu: {
    appTagline: 'સ્માર્ટ ખરીદી અને રીયલ-ટાઇમ કતાર',
    govtBadge: 'ભારત સરકાર APMC',
    switchRole: 'ભૂમિકા બદલો',

    roleFarmer: 'ખેડૂત એપ',
    roleOperator: 'મંડી ઓપરેટર',
    roleAdmin: 'એડમિનિસ્ટ્રેટર',

    navHome: 'હોમ',
    navCentres: 'કેન્દ્રો',
    navBookSlot: 'સ્લોટ બુક કરો',
    navMyToken: 'મારો ટોકન',
    navPayments: 'ચુકવણી',

    welcomeGreeting: 'નમસ્તે',

    heroBadge: 'સ્માર્ટ ખરીદી પ્લેટફોર્મ',
    heroTitle: 'તમારી મંડી મુલાકાતની વિશ્વાસ સાથે યોજના બનાવો.',
    heroDesc:
      'સ્લોટ બુક કરો, ડિજિટલ ટોકન મેળવો, તમારી કતાર લાઇવ જુઓ અને ખરીદીનો રેકોર્ડ એક જ જગ્યાએ રાખો.',

    bookProcurementSlot: 'ખરીદી સ્લોટ બુક કરો',
    exploreMandis: 'મંડીઓ જુઓ',

    activeBooking: 'સક્રિય બુકિંગ',
    queueStatus: 'કતાર સ્થિતિ',
    calledToGate: 'હવે ગેટ પર બોલાવવામાં આવ્યા છે',
    minWait: 'મિનિટ રાહ',
    slotConfirmed: 'સ્લોટ કન્ફર્મ છે',

    quickActions: 'ઝડપી ક્રિયાઓ',
    quickActionsTitle: 'તમને જરૂરી બધું એક ટેપ દૂર',

    bookSlot: 'સ્લોટ બુક કરો',
    reserveMandiVisit: 'તમારી મંડી મુલાકાત રિઝર્વ કરો.',

    myToken: 'મારો ટોકન',
    openPassQueue: 'પાસ અને લાઇવ કતાર જુઓ.',

    mandiCentres: 'મંડી કેન્દ્રો',
    capacityTimingsSlots: 'ક્ષમતા, સમય અને સ્લોટ જુઓ.',

    payments: 'ચુકવણી',
    procurementDbtRecords: 'ખરીદી અને DBT રેકોર્ડ જુઓ.',

    liveMsp: 'લાઇવ MSP',
    currentProcurementRates: 'વર્તમાન ખરીદી સંદર્ભ દરો',
    officialRates:
      'તમારા Mandi Setu કોમોડિટી કેટલોગમાં ઉપલબ્ધ સત્તાવાર દરો.',
    updatedFromLiveData: 'લાઇવ ડેટાથી અપડેટ થયું',

    planBeforeTravel: 'પ્રવાસ પહેલાં યોજના બનાવો',
    checkSlotsQueue:
      'મંડી જતાં પહેલાં સ્લોટ અને કતારની સ્થિતિ તપાસો.',

    transparentQueue: 'પારદર્શક કતાર',
    seePositionStage:
      'તમારી સ્થિતિ, તબક્કો અને અંદાજિત રાહનો સમય લાઇવ જુઓ.',

    digitalRecords: 'ડિજિટલ રેકોર્ડ',
    keepRecords:
      'ખરીદી, વજન અને ચુકવણીના રેકોર્ડ એક જગ્યાએ રાખો.',

    readyNextVisit: 'તમારી આગામી મંડી મુલાકાત માટે તૈયાર છો?',
    pickSlot:
      'તમારા સમય મુજબ સ્લોટ પસંદ કરો અને અનાવશ્યક રાહ ટાળો.',
    bookASlot: 'સ્લોટ બુક કરો',

    standardGrade: 'માનક ગ્રેડ',
    quintal: 'ક્વિન્ટલ',

    loginLoading: 'મંડી સેતુ લોડ થઈ રહ્યું છે...',
    verifyingAccount: 'તમારા એકાઉન્ટની ચકાસણી થઈ રહી છે',
  },

  /* ===================================================== */
  /* TELUGU                                                */
  /* ===================================================== */

  te: {
    appTagline: 'స్మార్ట్ సేకరణ & రియల్-టైమ్ క్యూ',
    govtBadge: 'భారత ప్రభుత్వం APMC',
    switchRole: 'పాత్రను మార్చండి',

    roleFarmer: 'రైతు యాప్',
    roleOperator: 'మండి ఆపరేటర్',
    roleAdmin: 'నిర్వాహకుడు',

    navHome: 'హోమ్',
    navCentres: 'కేంద్రాలు',
    navBookSlot: 'స్లాట్ బుక్ చేయండి',
    navMyToken: 'నా టోకెన్',
    navPayments: 'చెల్లింపులు',

    welcomeGreeting: 'నమస్తే',

    heroBadge: 'స్మార్ట్ సేకరణ ప్లాట్‌ఫారమ్',
    heroTitle: 'మీ మండి ప్రయాణాన్ని నమ్మకంతో ప్లాన్ చేసుకోండి.',
    heroDesc:
      'స్లాట్ బుక్ చేయండి, డిజిటల్ టోకెన్ పొందండి, మీ క్యూ స్థితిని లైవ్‌గా చూడండి మరియు సేకరణ రికార్డును ఒకే చోట ఉంచండి.',

    bookProcurementSlot: 'సేకరణ స్లాట్ బుక్ చేయండి',
    exploreMandis: 'మండీలను చూడండి',

    activeBooking: 'యాక్టివ్ బుకింగ్',
    queueStatus: 'క్యూ స్థితి',
    calledToGate: 'ఇప్పుడు గేట్‌కు పిలిచారు',
    minWait: 'నిమిషాల వేచి ఉండాలి',
    slotConfirmed: 'స్లాట్ నిర్ధారించబడింది',

    quickActions: 'త్వరిత చర్యలు',
    quickActionsTitle: 'మీకు అవసరమైన ప్రతిదీ ఒక్క ట్యాప్ దూరంలో',

    bookSlot: 'స్లాట్ బుక్ చేయండి',
    reserveMandiVisit: 'మీ మండి ప్రయాణాన్ని రిజర్వ్ చేయండి.',

    myToken: 'నా టోకెన్',
    openPassQueue: 'పాస్ మరియు లైవ్ క్యూ చూడండి.',

    mandiCentres: 'మండి కేంద్రాలు',
    capacityTimingsSlots: 'సామర్థ్యం, సమయాలు మరియు స్లాట్‌లను చూడండి.',

    payments: 'చెల్లింపులు',
    procurementDbtRecords: 'సేకరణ మరియు DBT రికార్డులను చూడండి.',

    liveMsp: 'లైవ్ MSP',
    currentProcurementRates: 'ప్రస్తుత సేకరణ సూచిక ధరలు',
    officialRates:
      'మీ Mandi Setu కమోడిటీ క్యాటలాగ్‌లో అందుబాటులో ఉన్న అధికారిక ధరలు.',
    updatedFromLiveData: 'లైవ్ డేటా నుండి అప్డేట్ చేయబడింది',

    planBeforeTravel: 'ప్రయాణానికి ముందు ప్లాన్ చేయండి',
    checkSlotsQueue:
      'మండికి బయలుదేరే ముందు స్లాట్ మరియు క్యూ స్థితిని చూడండి.',

    transparentQueue: 'పారదర్శక క్యూ',
    seePositionStage:
      'మీ స్థానం, దశ మరియు అంచనా వేచి ఉండే సమయాన్ని లైవ్‌గా చూడండి.',

    digitalRecords: 'డిజిటల్ రికార్డులు',
    keepRecords:
      'సేకరణ, తూకం మరియు చెల్లింపు రికార్డులను ఒకే చోట ఉంచండి.',

    readyNextVisit: 'మీ తదుపరి మండి ప్రయాణానికి సిద్ధంగా ఉన్నారా?',
    pickSlot:
      'మీ సమయానికి సరిపోయే స్లాట్‌ను ఎంచుకుని అనవసరమైన వేచిని నివారించండి.',
    bookASlot: 'స్లాట్ బుక్ చేయండి',

    standardGrade: 'ప్రామాణిక గ్రేడ్',
    quintal: 'క్వింటాల్',

    loginLoading: 'మండి సేతు లోడ్ అవుతోంది...',
    verifyingAccount: 'మీ ఖాతాను ధృవీకరిస్తోంది',
  },

  /* ===================================================== */
  /* TAMIL                                                 */
  /* ===================================================== */

  ta: {
    appTagline: 'ஸ்மார்ட் கொள்முதல் & நேரடி வரிசை',
    govtBadge: 'இந்திய அரசு APMC',
    switchRole: 'பாத்திரத்தை மாற்றவும்',

    roleFarmer: 'விவசாயி ஆப்',
    roleOperator: 'மண்டி ஆபரேட்டர்',
    roleAdmin: 'நிர்வாகி',

    navHome: 'முகப்பு',
    navCentres: 'மையங்கள்',
    navBookSlot: 'ஸ்லாட் முன்பதிவு',
    navMyToken: 'என் டோக்கன்',
    navPayments: 'பணம் செலுத்துதல்',

    welcomeGreeting: 'வணக்கம்',

    heroBadge: 'ஸ்மார்ட் கொள்முதல் தளம்',
    heroTitle: 'உங்கள் மண்டி பயணத்தை நம்பிக்கையுடன் திட்டமிடுங்கள்.',
    heroDesc:
      'ஸ்லாட்டை முன்பதிவு செய்யுங்கள், டிஜிட்டல் டோக்கனைப் பெறுங்கள், உங்கள் வரிசையை நேரலையில் பார்க்கவும், கொள்முதல் பதிவை ஒரே இடத்தில் வைத்திருக்கவும்.',

    bookProcurementSlot: 'கொள்முதல் ஸ்லாட் முன்பதிவு',
    exploreMandis: 'மண்டிகளைப் பார்க்கவும்',

    activeBooking: 'செயலில் உள்ள முன்பதிவு',
    queueStatus: 'வரிசை நிலை',
    calledToGate: 'இப்போது கேட் வர அழைக்கப்பட்டுள்ளார்',
    minWait: 'நிமிட காத்திருப்பு',
    slotConfirmed: 'ஸ்லாட் உறுதி செய்யப்பட்டது',

    quickActions: 'விரைவு செயல்கள்',
    quickActionsTitle: 'உங்களுக்கு தேவையான அனைத்தும் ஒரு டேப்பில்',

    bookSlot: 'ஸ்லாட் முன்பதிவு',
    reserveMandiVisit: 'உங்கள் மண்டி பயணத்தை முன்பதிவு செய்யுங்கள்.',

    myToken: 'என் டோக்கன்',
    openPassQueue: 'பாஸ் மற்றும் நேரடி வரிசையைப் பார்க்கவும்.',

    mandiCentres: 'மண்டி மையங்கள்',
    capacityTimingsSlots:
      'திறன், நேரங்கள் மற்றும் ஸ்லாட்களைப் பார்க்கவும்.',

    payments: 'பணம் செலுத்துதல்',
    procurementDbtRecords:
      'கொள்முதல் மற்றும் DBT பதிவுகளைப் பார்க்கவும்.',

    liveMsp: 'நேரடி MSP',
    currentProcurementRates: 'தற்போதைய கொள்முதல் குறிப்பு விலைகள்',
    officialRates:
      'உங்கள் Mandi Setu பொருள் பட்டியலில் உள்ள அதிகாரப்பூர்வ விலைகள்.',
    updatedFromLiveData: 'நேரடி தரவிலிருந்து புதுப்பிக்கப்பட்டது',

    planBeforeTravel: 'பயணத்திற்கு முன் திட்டமிடுங்கள்',
    checkSlotsQueue:
      'மண்டிக்கு செல்லும் முன் ஸ்லாட் மற்றும் வரிசை நிலையைப் பார்க்கவும்.',

    transparentQueue: 'வெளிப்படையான வரிசை',
    seePositionStage:
      'உங்கள் நிலை, கட்டம் மற்றும் மதிப்பிடப்பட்ட காத்திருப்பு நேரத்தை நேரலையில் பார்க்கவும்.',

    digitalRecords: 'டிஜிட்டல் பதிவுகள்',
    keepRecords:
      'கொள்முதல், எடை மற்றும் பணம் செலுத்தும் பதிவுகளை ஒரே இடத்தில் வைத்திருக்கவும்.',

    readyNextVisit: 'உங்கள் அடுத்த மண்டி பயணத்திற்கு தயாரா?',
    pickSlot:
      'உங்கள் நேரத்திற்கேற்ற ஸ்லாட்டைத் தேர்வு செய்து தேவையற்ற காத்திருப்பைத் தவிர்க்கவும்.',
    bookASlot: 'ஸ்லாட்டை முன்பதிவு செய்யுங்கள்',

    standardGrade: 'நிலையான தரம்',
    quintal: 'குவிண்டால்',

    loginLoading: 'மண்டி சேது ஏற்றப்படுகிறது...',
    verifyingAccount: 'உங்கள் கணக்கு சரிபார்க்கப்படுகிறது',
  },
}