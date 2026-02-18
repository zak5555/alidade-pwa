/**
 * ALIDADE Phrase Config Data
 * Extracted static phrase/audio datasets from app.js.
 */
(function registerAlidadePhraseConfig(windowObj) {
    if (!windowObj) return;

    const ARABIC_PHRASES = {
        greetings: [
            { id: 'g01', arabic: 'السلام عليكم', darija: 'salam alaykoum', phonetic: 'sa-LAM a-LAY-koom', english: 'Peace be upon you', audio: 'assets/audio/g01_salam.mp3', difficulty: 'easy', tips: 'Most respectful greeting. Use when entering shops.', gender: 'neutral' },
            { id: 'g02', arabic: 'صباح الخير', darija: 'sbah lkhir', phonetic: 'SBAH l-KHEER', english: 'Good morning', audio: 'assets/audio/g02_sbah_lkhir.mp3', difficulty: 'easy', tips: 'Use before noon. Friendly opener.', gender: 'neutral' },
            { id: 'g03', arabic: 'مساء الخير', darija: 'msa lkhir', phonetic: 'MSA l-KHEER', english: 'Good evening', audio: 'assets/audio/g03_msa_lkhir.mp3', difficulty: 'easy', tips: 'Use after sunset.', gender: 'neutral' },
            { id: 'g04', arabic: 'شكرا', darija: 'shukran', phonetic: 'SHUK-ran', english: 'Thank you', audio: 'assets/audio/g04_shukran.mp3', difficulty: 'easy', tips: 'Basic politeness. Use often!', gender: 'neutral' },
            { id: 'g05', arabic: 'عفوا', darija: 'afwan', phonetic: 'AF-wan', english: "You're welcome", audio: 'assets/audio/g05_afwan.mp3', difficulty: 'easy', tips: 'Response to shukran.', gender: 'neutral' },
            { id: 'g06', arabic: 'لا شكرا', darija: 'la shukran', phonetic: 'LA SHUK-ran', english: 'No thank you', audio: 'assets/audio/g06_la_shukran.mp3', difficulty: 'easy', tips: 'Polite but firm refusal.', gender: 'neutral' },
            { id: 'g07', arabic: 'الله يسهل', darija: 'allah ysahel', phonetic: 'AL-lah y-SA-hel', english: 'May God make it easy', audio: 'assets/audio/g07_allah_ysahel.mp3', difficulty: 'medium', tips: 'Blessing phrase. Shows cultural respect.', gender: 'neutral' },
            { id: 'g08', arabic: 'أنا فاهم', darija: 'ana fahem', phonetic: 'A-na FA-hem', english: 'I understand', audio: 'assets/audio/g08_ana_fahem.mp3', difficulty: 'easy', tips: 'Use to confirm comprehension.', gender: 'male' },
            { id: 'g09', arabic: 'بسلامة', darija: 'bslama', phonetic: 'b-SLA-ma', english: 'Goodbye', audio: 'assets/audio/g09_bslama.mp3', difficulty: 'easy', tips: 'Casual farewell.', gender: 'neutral' },
            { id: 'g10', arabic: 'كيف داير؟', darija: 'kif dayr?', phonetic: 'KEEF DAY-er', english: 'How are you?', audio: 'assets/audio/g10_kif_dayr.mp3', difficulty: 'easy', tips: 'Male form. Female: kif dayra?', gender: 'male' }
        ],
        shopping: [
            { id: 's01', arabic: 'بشحال؟', darija: 'bchhal?', phonetic: 'b-CHHAL', english: 'How much?', audio: 'assets/audio/s01_bchhal.mp3', difficulty: 'easy', tips: 'Essential! Use for everything.', gender: 'neutral' },
            { id: 's02', arabic: 'غالي بزاف', darija: 'ghali bezaf', phonetic: 'GHA-li b-ZAF', english: 'Too expensive', audio: 'assets/audio/s02_ghali_bezaf.mp3', difficulty: 'easy', tips: 'Your secret weapon. Act shocked!', gender: 'neutral' },
            { id: 's03', arabic: 'نقص شوية', darija: 'nqas shwiya', phonetic: 'n-KAS SHWEE-ya', english: 'Reduce a little', audio: 'assets/audio/s03_nqas_shwiya.mp3', difficulty: 'medium', tips: 'Polite way to ask for discount.', gender: 'neutral' },
            { id: 's04', arabic: 'آخر ثمن؟', darija: 'akhir taman?', phonetic: 'A-khir ta-MAN', english: 'Last price?', audio: 'assets/audio/s04_akhir_taman.mp3', difficulty: 'medium', tips: 'Ask this to get final offer.', gender: 'neutral' },
            { id: 's05', arabic: 'ما بغيت والو', darija: 'ma bghit walo', phonetic: 'ma BGHIT WA-lo', english: "I don't want anything", audio: 'assets/audio/s05_ma_bghit_walo.mp3', difficulty: 'medium', tips: 'Firm but polite exit.', gender: 'neutral' },
            { id: 's06', arabic: 'بلاش', darija: 'blach', phonetic: 'BLASH', english: 'No way / Forget it', audio: 'assets/audio/s06_blach.mp3', difficulty: 'easy', tips: 'Casual rejection. Keep walking.', gender: 'neutral' },
            { id: 's07', arabic: 'لا صافي', darija: 'la safi', phonetic: 'LA SA-fee', english: "No, that's enough", audio: 'assets/audio/s07_la_safi.mp3', difficulty: 'easy', tips: 'End the negotiation firmly.', gender: 'neutral' },
            { id: 's08', arabic: 'هذا مزور', darija: 'hada mzawer', phonetic: 'HA-da m-ZA-wer', english: 'This is fake', audio: 'assets/audio/s08_hada_mzawer.mp3', difficulty: 'medium', tips: 'Call out counterfeit goods.', gender: 'neutral' },
            { id: 's09', arabic: 'ماشي يورو', darija: 'machi euro', phonetic: 'MA-shi EU-ro', english: "I don't pay in euros", audio: 'assets/audio/s09_machi_euro.mp3', difficulty: 'easy', tips: 'Insist on MAD pricing.', gender: 'neutral' },
            { id: 's10', arabic: 'ها 200 درهم', darija: 'ha 200 dirham', phonetic: 'HA mya-TAYN dir-HAM', english: 'Here is 200 dirhams', audio: 'assets/audio/s10_ha_200dh.mp3', difficulty: 'medium', tips: 'Making a counteroffer.', gender: 'neutral' },
            { id: 's11', arabic: 'ماشي سائح', darija: 'mashi tourist', phonetic: 'MA-shi too-RIST', english: "I'm not a tourist", audio: 'assets/audio/s11_mashi_tourist.mp3', difficulty: 'easy', tips: 'Claim local status for fairer prices.', gender: 'neutral' },
            { id: 's12', arabic: 'أنا ساكن هنا', darija: 'ana saken hna', phonetic: 'A-na SA-ken HNA', english: 'I live here', audio: 'assets/audio/s12_ana_saken_hna.mp3', difficulty: 'medium', tips: 'Supports your local claim.', gender: 'male' },
            { id: 's13', arabic: 'سير بحالك', darija: 'sir b7alak', phonetic: 'SEER b-HA-lak', english: 'Go away / Leave me alone', audio: 'assets/audio/s13_sir_b7alak.mp3', difficulty: 'medium', tips: 'Firm dismissal. Use if harassed.', gender: 'neutral' },
            { id: 's14', arabic: 'ما طلبتش هادشي', darija: "ma tlabtch hadchi", phonetic: 'ma t-LABT-ch HAD-chi', english: "I didn't order this", audio: 'assets/audio/s14_matlabtch_hadchi.mp3', difficulty: 'hard', tips: 'Refuse unwanted items.', gender: 'neutral' },
            { id: 's15', arabic: 'واخا غادي ناخدو', darija: 'wakha ghadi nakhdou', phonetic: 'WA-kha GHA-di NAKH-dou', english: "OK, I'll take it", audio: 'assets/audio/s15_wakha.mp3', difficulty: 'medium', tips: 'Accept the deal.', gender: 'neutral' }
        ],
        directions: [
            { id: 'd01', arabic: 'فين؟', darija: 'fin?', phonetic: 'FEEN', english: 'Where?', audio: 'assets/audio/d01_fin.mp3', difficulty: 'easy', tips: 'Start of any direction question.', gender: 'neutral' },
            { id: 'd02', arabic: 'فين كاين...؟', darija: 'fin kayn...?', phonetic: 'FEEN KAY-en', english: 'Where is...?', audio: 'assets/audio/d02_fin_kayn.mp3', difficulty: 'easy', tips: 'Add place name after.', gender: 'neutral' },
            { id: 'd03', arabic: 'ليمين', darija: 'lymen', phonetic: 'l-YE-men', english: 'Right', audio: 'assets/audio/d03_lymen.mp3', difficulty: 'easy', tips: 'Turn right.', gender: 'neutral' },
            { id: 'd04', arabic: 'ليسار', darija: 'lysar', phonetic: 'l-YE-sar', english: 'Left', audio: 'assets/audio/d04_lysar.mp3', difficulty: 'easy', tips: 'Turn left.', gender: 'neutral' },
            { id: 'd05', arabic: 'نيشان', darija: 'nishan', phonetic: 'NEE-shan', english: 'Straight', audio: 'assets/audio/d05_nishan.mp3', difficulty: 'easy', tips: 'Go straight ahead.', gender: 'neutral' },
            { id: 'd06', arabic: 'قريب', darija: 'qrib', phonetic: 'KREEB', english: 'Near/Close', audio: 'assets/audio/d06_qrib.mp3', difficulty: 'easy', tips: 'It is close by.', gender: 'neutral' },
            { id: 'd07', arabic: 'بعيد', darija: "b3id", phonetic: 'B-EED', english: 'Far', audio: 'assets/audio/d07_b3id.mp3', difficulty: 'easy', tips: 'It is far away.', gender: 'neutral' },
            { id: 'd08', arabic: 'فين جامع الفنا؟', darija: 'fin jama3 lfna?', phonetic: 'FEEN ja-MA l-FNA', english: 'Where is Jemaa el-Fnaa?', audio: 'assets/audio/d08_fin_jamaa_lfna.mp3', difficulty: 'medium', tips: 'The main square.', gender: 'neutral' },
            { id: 'd09', arabic: 'فين الرياض؟', darija: 'fin riad?', phonetic: 'FEEN ree-YAD', english: 'Where is the riad?', audio: 'assets/audio/d09_fin_riad.mp3', difficulty: 'easy', tips: 'Find your accommodation.', gender: 'neutral' },
            { id: 'd10', arabic: 'واش بعيد من هنا؟', darija: 'wach b3id mn hna?', phonetic: 'WASH B-EED mn HNA', english: 'Is it far from here?', audio: 'assets/audio/d10_wach_b3id.mp3', difficulty: 'medium', tips: 'Check distance before walking.', gender: 'neutral' }
        ],
        numbers: [
            { id: 'n01', arabic: 'عشرة', darija: '3achra', phonetic: 'AASH-ra', english: '10 (ten)', audio: 'assets/audio/n01_10.mp3', difficulty: 'easy', tips: 'Ten dirhams.', gender: 'neutral' },
            { id: 'n02', arabic: 'عشرين', darija: '3chrin', phonetic: 'AASH-reen', english: '20 (twenty)', audio: 'assets/audio/n02_20.mp3', difficulty: 'easy', tips: 'Twenty dirhams.', gender: 'neutral' },
            { id: 'n03', arabic: 'خمسين', darija: 'khamsin', phonetic: 'KHAM-seen', english: '50 (fifty)', audio: 'assets/audio/n03_50.mp3', difficulty: 'easy', tips: 'Fifty dirhams.', gender: 'neutral' },
            { id: 'n04', arabic: 'مئة', darija: 'mya', phonetic: 'MEE-ya', english: '100 (hundred)', audio: 'assets/audio/n04_100.mp3', difficulty: 'easy', tips: 'One hundred dirhams.', gender: 'neutral' },
            { id: 'n05', arabic: 'مئتين', darija: 'myatayn', phonetic: 'mya-TAYN', english: '200 (two hundred)', audio: 'assets/audio/n05_200.mp3', difficulty: 'medium', tips: 'Two hundred dirhams.', gender: 'neutral' },
            { id: 'n06', arabic: 'خمس مئة', darija: 'khams mya', phonetic: 'KHAMS MEE-ya', english: '500 (five hundred)', audio: 'assets/audio/n06_500.mp3', difficulty: 'medium', tips: 'Five hundred dirhams.', gender: 'neutral' },
            { id: 'n07', arabic: 'ألف', darija: 'alf', phonetic: 'ALF', english: '1000 (thousand)', audio: 'assets/audio/n07_1000.mp3', difficulty: 'easy', tips: 'One thousand dirhams.', gender: 'neutral' },
            { id: 'n08', arabic: 'واحد', darija: 'wahed', phonetic: 'WA-hed', english: '1 (one)', audio: 'assets/audio/n08_1.mp3', difficulty: 'easy', tips: 'One item.', gender: 'neutral' },
            { id: 'n09', arabic: 'جوج', darija: 'jouj', phonetic: 'JOOJ', english: '2 (two)', audio: 'assets/audio/n09_2.mp3', difficulty: 'easy', tips: 'Two items.', gender: 'neutral' },
            { id: 'n10', arabic: 'ثلاثة', darija: 'tlata', phonetic: 'TLA-ta', english: '3 (three)', audio: 'assets/audio/n10_3.mp3', difficulty: 'easy', tips: 'Three items.', gender: 'neutral' }
        ],
        emergency: [
            { id: 'e01', arabic: 'عاونوني', darija: '3awnuni', phonetic: 'AAW-noo-nee', english: 'Help me!', audio: 'assets/audio/e01_3awnuni.mp3', difficulty: 'medium', tips: 'Shout if in danger.', gender: 'neutral' },
            { id: 'e02', arabic: 'البوليس', darija: 'lbulis', phonetic: 'l-boo-LEES', english: 'Police', audio: 'assets/audio/e02_lbulis.mp3', difficulty: 'easy', tips: 'Call for police.', gender: 'neutral' },
            { id: 'e03', arabic: 'نعيط للبوليس', darija: "n3ayat l'police", phonetic: "n-AY-yat l-po-LEES", english: "I'll call the police", audio: 'assets/audio/e03_n3ayat_police.mp3', difficulty: 'medium', tips: 'Threat to discourage trouble.', gender: 'neutral' },
            { id: 'e04', arabic: 'سبيطار', darija: 'sbitar', phonetic: 'sbee-TAR', english: 'Hospital', audio: 'assets/audio/e04_sbitar.mp3', difficulty: 'easy', tips: 'Medical emergency.', gender: 'neutral' },
            { id: 'e05', arabic: 'حشومة', darija: 'hshuma', phonetic: 'h-SHOO-ma', english: "Shame on you!", audio: 'assets/audio/e05_hshuma.mp3', difficulty: 'easy', tips: 'Powerful cultural shaming.', gender: 'neutral' },
            { id: 'e06', arabic: 'أنا عارف الستاف', darija: 'ana 3araf staff', phonetic: 'A-na AA-raf STAFF', english: 'I know the staff here', audio: 'assets/audio/e06_ana_3araf_staff.mp3', difficulty: 'medium', tips: 'Claim insider status.', gender: 'male' },
            { id: 'e07', arabic: 'خدام كومبيوتر', darija: 'khadam computer', phonetic: 'KHA-dam kom-PYOO-ter', english: 'I work on computers', audio: 'assets/audio/e07_khadam_computer.mp3', difficulty: 'medium', tips: 'Explain your job (generic).', gender: 'male' }
        ],
        food: [
            { id: 'f01', arabic: 'عصير', darija: '3assir', phonetic: 'AA-seer', english: 'Juice', audio: 'assets/audio/f01_3assir.mp3', difficulty: 'easy', tips: 'Fresh orange juice is famous!', gender: 'neutral' },
            { id: 'f02', arabic: 'همزة', darija: 'hemza', phonetic: 'HEM-za', english: 'Hemza (name/bread roll)', audio: 'assets/audio/f02_hemza.mp3', difficulty: 'easy', tips: 'Common bread roll type.', gender: 'neutral' },
            { id: 'f03', arabic: 'أتاي', darija: 'atay', phonetic: 'a-TAY', english: 'Mint tea', audio: 'assets/audio/f03_atay.mp3', difficulty: 'easy', tips: 'National drink. Never refuse!', gender: 'neutral' },
            { id: 'f04', arabic: 'خبز', darija: 'khobz', phonetic: 'KHOBZ', english: 'Bread', audio: 'assets/audio/f04_khobz.mp3', difficulty: 'easy', tips: 'Moroccan flatbread.', gender: 'neutral' },
            { id: 'f05', arabic: 'ما', darija: 'ma', phonetic: 'MA', english: 'Water', audio: 'assets/audio/f05_ma.mp3', difficulty: 'easy', tips: 'Ask for bottled water.', gender: 'neutral' },
            { id: 'f06', arabic: 'طاجين', darija: 'tajin', phonetic: 'ta-JEEN', english: 'Tagine (dish)', audio: 'assets/audio/f06_tajin.mp3', difficulty: 'easy', tips: 'Traditional slow-cooked stew.', gender: 'neutral' }
        ]
    };

    const EXISTING_AUDIO_FILES = new Set([
        'g01_salam.mp3', 'g02_sbah_lkhir.mp3', 'g03_msa_lkhir.mp3', 'g04_shukran.mp3', 'g05_afwan.mp3',
        'g06_la_shukran.mp3', 'g07_allah_ysahel.mp3', 'g08_ana_fahem.mp3', 'g09_bslama.mp3', 'g10_kif_dayr.mp3',
        's01_bchhal.mp3', 's02_ghali_bezaf.mp3', 's03_nqas_shwiya.mp3', 's04_akhir_taman.mp3', 's05_ma_bghit_walo.mp3',
        's06_blach.mp3', 's07_la_safi.mp3', 's08_hada_mzawer.mp3', 's09_machi_euro.mp3', 's10_ha_200dh.mp3',
        's11_mashi_tourist.mp3', 's12_ana_saken_hna.mp3', 's13_sir_b7alak.mp3', 's14_matlabtch_hadchi.mp3', 's15_wakha.mp3',
        'd01_fin.mp3', 'd02_fin_kayn.mp3', 'd03_lymen.mp3', 'd04_lysar.mp3', 'd05_nishan.mp3',
        'd06_qrib.mp3', 'd07_b3id.mp3', 'd08_fin_jamaa_lfna.mp3', 'd09_fin_riad.mp3', 'd10_wach_b3id.mp3',
        'n01_10.mp3', 'n02_20.mp3', 'n03_50.mp3', 'n04_100.mp3', 'n05_200.mp3', 'n06_500.mp3', 'n07_1000.mp3',
        'n08_1.mp3', 'n09_2.mp3', 'n10_3.mp3',
        'e01_3awnuni.mp3', 'e02_lbulis.mp3', 'e03_n3ayat_police.mp3', 'e04_sbitar.mp3', 'e05_hshuma.mp3',
        'e06_ana_3araf_staff.mp3', 'e07_khadam_computer.mp3',
        'f01_3assir.mp3', 'f02_hemza.mp3', 'f03_atay.mp3', 'f04_khobz.mp3', 'f05_ma.mp3', 'f06_tajin.mp3'
    ]);

    windowObj.ALIDADE_PHRASE_CONFIG = windowObj.ALIDADE_PHRASE_CONFIG || {};
    windowObj.ALIDADE_PHRASE_CONFIG.ARABIC_PHRASES = ARABIC_PHRASES;
    windowObj.ALIDADE_PHRASE_CONFIG.EXISTING_AUDIO_FILES = EXISTING_AUDIO_FILES;
})(typeof window !== 'undefined' ? window : null);
