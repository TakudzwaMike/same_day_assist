import { 
  TechnicalAssessmentReport, 
  AlarmSystemAssessment, 
  CctvSystemAssessment, 
  AccessControlAssessment, 
  IntercomAssessment, 
  GarageDoorAssessment, 
  GateMotorAssessment, 
  ElectricFenceAssessment, 
  BoomGateSystemAssessment, 
  TurnstileSystemAssessment,
  AssessmentSystemStatus
} from '../types/technicalAssessment';

export const PROPERTY_TYPES = [
  'House',
  'Townhouse',
  'Flat',
  'Estate',
  'Complex',
  'Business',
  'Other'
] as const;

export const PROVINCES_ZA = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
] as const;

export const SYSTEM_PRESENCE_OPTIONS: AssessmentSystemStatus[] = [
  'Not installed',
  'Installed and fully functional',
  'Installed and partially functional',
  'Installed but not functional',
  'Installed but unable to test'
];

export const ALARM_PANEL_BRANDS = [
  'Paradox (Spectra / Magellan / EVO)',
  'IDS (X-Series / 805)',
  'DSC (PowerSeries / Neo)',
  'Texecom (Premier Elite)',
  'AJAX Wireless Systems',
  'Hikvision AX PRO',
  'Other'
];

export const CCTV_BRANDS = [
  'Hikvision Digital',
  'Dahua Technology',
  'Uniview (UNV)',
  'Provision-ISR',
  'Axis Communications',
  'Tiandy AI',
  'TVT Digital',
  'Other'
];

export const CCTV_CABLE_TYPES = [
  'RG59 coaxial (LG59)',
  'Other coaxial',
  'CAT5e UTP/STP',
  'CAT6 Gigabit',
  'Fibre Optic',
  'Wireless Link',
  'Other'
];

export const ACCESS_CONTROL_BRANDS = [
  'ZKTeco Biometrics',
  'Impro Technologies',
  'Paxton Access',
  'Centurion Systems',
  'Suprema Inc.',
  'Dahua Access',
  'Hikvision Terminals',
  'Other'
];

export const INTERCOM_BRANDS = [
  'Dahua Video Intercom',
  'Hikvision Video Door Station',
  'Centurion Polo / G-Speak 4G',
  'Commax Intercoms',
  'Kocom Audio/Video',
  'Bticino Legrand',
  'Ring / Eufy Video Doorbell',
  'Other'
];

export const GARAGE_MOTOR_BRANDS = [
  'Centurion SDO4 Smart',
  'DigiDoor 1 / 2 / 24',
  'Centurion RDO Roll-up',
  'Marantec Comfort',
  'Gemini Automation',
  'Pro-Alpha Systems',
  'Other'
];

export const GATE_MOTOR_BRANDS = [
  'Centurion D5 Evo (Sliding)',
  'Centurion D10 / D10 Turbo Smart',
  'Centurion D5 Smart',
  'ET Nice Drive 500 / 600',
  'Centurion Vantage (Swing)',
  'Gemini 7Ah / 12Ah',
  'Hansa Elite',
  'Other'
];

export const ELECTRIC_FENCE_BRANDS = [
  'Nemtek Druid (13 / 15 / 18 / 24)',
  'Nemtek Merlin Stealth (M18 / M28)',
  'Stafix Energizers',
  'JVA Security Energizers',
  'Gallagher Electric Fence',
  'Other'
];

export const BOOM_GATE_BRANDS = [
  'Centurion Sector 3m / 4.5m / 6m',
  'Magnetic Access (Magnetic Autocontrol)',
  'Turnstar Traffic-Master',
  'CAME Gard Series',
  'BFT Michelangelo / Giotto',
  'Nice M-Bar / L-Bar',
  'Other'
];

export const TURNSTILE_BRANDS = [
  'Turnstar Trident / Tribune',
  'Boon Edam Turnstiles',
  'ZKTeco Tripod / Speed Gate',
  'Gunnebo SpeedStile',
  'Centurion Pedestrian Barrier',
  'Other'
];

export const UNTESTED_REASONS = [
  'Unsafe high-voltage electrical hazard / exposed live wire',
  'Roof crawl-space inaccessible without safety harness',
  'Member declined test / requested power supply preserved',
  'Master security keys / PIN codes not available on-site',
  'Inclement high-veld thunderstorm / lightning risk',
  'Physical obstruction / gate blocked by construction material',
  'Other'
];

export function createDefaultTechnicalAssessment(enquiry?: any, contractor?: any): TechnicalAssessmentReport {
  const customerName = enquiry?.customerName || 'Registered Member';
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Member';

  const rawAddress = enquiry?.address || '124 Market Street, Fairview, Johannesburg, 2094';
  const isBusiness = enquiry?.accountType === 'Business' || enquiry?.serviceCategory?.toLowerCase().includes('business');

  return {
    id: `TA-${Date.now().toString(36).toUpperCase()}`,
    assessmentId: enquiry?.id || `ASSESS-${Date.now()}`,
    enquiryId: enquiry?.id || `ENQ-${Date.now()}`,
    customerId: enquiry?.customerId || 'CUST-AUTO-01',
    customerName,
    accountType: isBusiness ? 'Business' : 'House',
    version: '2.0',
    assessmentDate: new Date().toISOString(),
    
    // 1 | MEMBER PROFILE & VERIFIED LOCATION
    memberInfo: {
      legalFirstName: firstName,
      legalLastName: lastName,
      membershipId: `SDA-${Math.floor(100000 + Math.random() * 900000)}`,
      primaryPhone: enquiry?.phone || '082 555 0192',
      alternatePhone: '',
      email: enquiry?.email || 'member@samedayassist.co.za',
      selectedPackage: enquiry?.serviceCategory || 'Platinum Emergency Assist',
      joinDate: new Date().toISOString().split('T')[0],
      appointmentDateTime: new Date().toISOString(),
      assignedTechnicianId: contractor?.id || 't1',
      assignedTechnicianName: contractor?.name || 'Certified Field Technician',
      assignedTechnicianEmployeeId: 'SDA-TECH-048',
      status: 'In progress',
      representativeContact: {
        name: customerName,
        phone: enquiry?.phone || '082 555 0192',
        relationshipOrTitle: isBusiness ? 'Facilities Director' : 'Property Owner'
      },
      propertyAccessPermissionsGranted: true,
      accessPermissionNotes: 'Full perimeter, gate motor and control room access granted by member.'
    },

    // 1 | MANDATORY STRUCTURED ADDRESS
    addressInfo: {
      propertyType: isBusiness ? 'Business' : 'House',
      estateOrComplexName: '',
      buildingOrBlock: '',
      unitOrStandNumber: 'Stand 448',
      streetNumber: '124',
      streetName: 'Market Street',
      suburb: 'Fairview',
      city: 'Johannesburg',
      regionOrServiceArea: 'Gauteng Central',
      province: 'Gauteng',
      postalCode: '2094',
      hasNoStreetNumberException: false,
      noStreetNumberReason: '',
      gpsCoordinates: {
        lat: -26.2041,
        lng: 28.0473
      },
      entranceGateToUse: 'Main sliding perimeter entrance (Lane 1)',
      gateAccessInstructions: 'Intercom call code 104 or hoot at security guardhouse',
      parkingAndNavigationNotes: 'Paved visitors bay inside perimeter security boundary',
      propertyEntrancePhotoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60',
      visibleAddressStandPhotoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=60',
      addressVerifiedWithMember: true
    },

    // 2-9 & 14-15 | ASSESSED SYSTEMS
    systems: {
      // 3 | ALARM
      alarm: {
        presence: 'Installed and fully functional',
        panelBrand: 'Paradox (Spectra / Magellan / EVO)',
        panelModel: 'SP6000 Hybrid',
        panelFirmware: 'v5.24',
        panelSerialNumber: 'PX-98234-ZA',
        panelLocation: 'Master Bedroom Walk-in Enclosure',
        zonesSupported: 32,
        zonesUsed: 12,
        partitionsCount: 2,
        enclosurePcbPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'],
        systemConfiguration: 'Semi-wireless (hybrid)',
        expanders: [
          {
            id: 'exp-1',
            type: 'Remote (hardwired) expander',
            makeModel: 'Paradox ZX8 8-Zone Expander',
            location: 'Ceiling Roof Space Hub',
            serialNumber: 'ZX8-44910',
            photoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60'
          }
        ],
        mainsVoltageVAC: 228,
        chargingVoltageVDC: 13.8,
        batterySpec: '12V 8Ah Lithium LiFePO4',
        batteryCondition: 'Good',
        batteryBackupTestPass: true,
        tamperFaultOk: true,
        faultIndicatorsPresent: [],
        keypads: [
          {
            id: 'kp-1',
            location: 'Front Foyer Entrance',
            brandModel: 'Paradox K32LCD+',
            type: 'LCD',
            connection: 'Wired',
            keypadTestPassed: true,
            backlightFunctional: true,
            tamperOperational: true,
            damageOrWaterIngress: 'None'
          }
        ],
        detectors: [
          {
            id: 'det-1',
            zoneNumber: 1,
            descriptiveName: 'Front Entrance Door Contact',
            location: 'Main Foyer Door',
            type: 'Door/window contacts',
            brandModel: 'Magnetic Reed Heavy Duty',
            connection: 'Wired',
            testResult: 'Pass'
          },
          {
            id: 'det-2',
            zoneNumber: 2,
            descriptiveName: 'Formal Lounge Pet-friendly PIR',
            location: 'Lounge North Corner',
            type: 'PIR/pet-friendly PIR',
            brandModel: 'Paradox NV5 Digital',
            connection: 'Wired',
            testResult: 'Pass'
          },
          {
            id: 'det-3',
            zoneNumber: 3,
            descriptiveName: 'Driveway Dual Outdoor Beam',
            location: 'East Boundary Wall',
            type: 'Indoor/outdoor/roof beams',
            brandModel: 'Optex AX-100TFR Quad',
            connection: 'Wireless',
            testResult: 'Pass'
          }
        ],
        existingZoneListAvailable: 'Available',
        existingZoneListScanPhotoUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=60',
        walkTestCompleted: true,
        zoneSchedule: [
          { zoneNumber: 1, clientExistingName: 'Front Door', verifiedPhysicalName: 'Front Entrance Door Contact', status: 'Matched' },
          { zoneNumber: 2, clientExistingName: 'Lounge PIR', verifiedPhysicalName: 'Formal Lounge Pet-friendly PIR', status: 'Matched' },
          { zoneNumber: 3, clientExistingName: 'Garden Beam', verifiedPhysicalName: 'Driveway Dual Outdoor Beam', status: 'Matched' }
        ],
        functionalTests: {
          walkTestPassed: true,
          sirensStrobesFunctional: true,
          panicDevicesOperational: true,
          acLossBatteryBackupPassed: true,
          bypassTamperIndicatorsClear: true,
          eventLogChecked: true
        },
        monitoringSignalPath: 'GSM-LTE',
        monitoringTestSuccessful: true,
        mobileAppLinkageOperational: true,
        remoteArmDisarmVerified: true,
        faults: []
      },

      // 4 | CCTV
      cctv: {
        presence: 'Installed and fully functional',
        recorderType: 'NVR',
        brand: 'Hikvision Digital',
        model: 'DS-7608NXI-I2/8P AcuSense',
        firmwareVersion: 'v4.61.025',
        serialNumber: 'HK-99210-NVR',
        labelPhotos: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60'],
        channelCapacity: 8,
        activeCamerasCount: 4,
        spareChannelsCount: 4,
        hddCount: 1,
        individualHddCapacitiesTB: [4],
        totalStorageTB: 4,
        driveHealth: 'Good',
        recordingMode: 'Smart AI',
        recordingResolution: '4K (8MP) Main Stream',
        frameRateFps: 25,
        verifiedRetentionDays: 24,
        dateTimeAccurate: true,
        liveViewPlaybackExportTestPass: true,
        recorderPsuUpsBackupPass: true,
        cameras: [
          {
            id: 'cam-1',
            cameraNumber: 1,
            descriptiveName: 'Front Gate / Street Number View',
            location: 'Front Palisade Post',
            brand: 'Hikvision',
            model: 'ColorVu 4MP Turret',
            signalType: 'IP',
            formFactor: 'Turret',
            resolutionMp: '4MP',
            lensMm: '2.8mm Wide',
            nightVisionTech: 'Full-colour (ColorVu/etc)',
            fixedOrVarifocal: 'Fixed',
            audioSupport: 'Built-in mic',
            weatherRating: 'IP67',
            powerType: 'PoE standard',
            dayNightQualityPass: true,
            testResult: 'Pass',
            isVehicleLprAnpr: true
          },
          {
            id: 'cam-2',
            cameraNumber: 2,
            descriptiveName: 'Driveway Approach & Garage',
            location: 'Garage Eaves West',
            brand: 'Hikvision',
            model: 'DarkFighter 4MP Bullet',
            signalType: 'IP',
            formFactor: 'Bullet',
            resolutionMp: '4MP',
            lensMm: '4.0mm',
            nightVisionTech: 'Low-light (DarkFighter)',
            fixedOrVarifocal: 'Fixed',
            audioSupport: 'None',
            weatherRating: 'IP67',
            powerType: 'PoE standard',
            dayNightQualityPass: true,
            testResult: 'Pass',
            isVehicleLprAnpr: false
          }
        ],
        cablingType: 'RG59 coaxial (LG59)',
        cablingCondition: 'Good',
        connectorsUsed: 'BNC',
        multiOutputPsuDetails: '9-Way 12V 10A Central Fused Power Box with Battery Float',
        poeSwitchPortCount: 8,
        internetConnectionRouterOk: true,
        mobileAppDisplaysThisPropertyVerified: true,
        authorizedAppUsersCount: 2,
        monitorsCount: 1,
        monitorDetails: 'Samsung 32-inch 1080p LED Monitor in Security Nook',
        monitorConnectionTypes: ['HDMI'],
        signalAccessoriesNotes: 'HDMI Extender over Cat6 verified for kitchen sub-monitor.',
        faults: []
      },

      // 5 | ACCESS CONTROL
      accessControl: {
        presence: 'Installed and fully functional',
        controllerBrand: 'ZKTeco Biometrics',
        controllerModel: 'inBio260 Package',
        serialNumber: 'ZK-88219-AC',
        installedLocation: 'Server Cabinet Utility Room',
        pcbLabelPhotos: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60'],
        supportedDoorsCount: 2,
        activeDoorsCount: 2,
        topology: 'Networked',
        powerSupplyBackupPass: true,
        networkConnectionPass: true,
        readers: [
          {
            id: 'rdr-1',
            type: 'Fingerprint',
            doorLocation: 'Pedestrian Side Entrance',
            makeModel: 'ZKTeco FR1200 Slave Reader',
            testResult: 'Pass'
          },
          {
            id: 'rdr-2',
            type: 'RFID card/tag/fob',
            doorLocation: 'Main Foyer Glass Door',
            makeModel: 'Proximity 125kHz Wiegand',
            testResult: 'Pass'
          }
        ],
        locks: [
          {
            id: 'lck-1',
            doorLocation: 'Pedestrian Gate',
            type: 'Maglock',
            holdingForceOrRating: '280kg Heavy Duty Weatherproof',
            testResult: 'Pass'
          },
          {
            id: 'lck-2',
            doorLocation: 'Emergency Exit Door',
            type: 'Emergency break-glass release',
            holdingForceOrRating: 'Standard Green Break Glass',
            testResult: 'Pass'
          }
        ],
        functionalTests: {
          entryExitTestPassed: true,
          lockUnlockOperational: true,
          powerFailureBehaviorPassed: true,
          emergencyReleaseBreakGlassPassed: true,
          doorOpenTamperAlertsPassed: true,
          logsReportingOperational: true,
          remoteManagementOperational: true
        },
        faults: []
      },

      // 6 | INTERCOM
      intercom: {
        presence: 'Installed and fully functional',
        brand: 'Dahua Video Intercom',
        model: 'VTO2202F-P-S2 IP Villa Door Station',
        systemType: 'Video',
        connectionType: 'IP',
        scale: 'Single residence',
        entranceStationPhotoUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60',
        videoMonitorsCount: 1,
        audioHandsetsCount: 0,
        handsets: [
          {
            id: 'hnd-1',
            location: 'Kitchen Central Counter',
            model: 'Dahua VTH2421FB 7-inch Touchscreen',
            isVideoMonitor: true,
            micSpeakerCallTestPass: true,
            screenDisplayPass: true
          }
        ],
        triggeredOutputs: [
          { outputType: 'Pedestrian gate', testedSeparately: true, testResult: 'Pass' },
          { outputType: 'Driveway gate', testedSeparately: true, testResult: 'Pass' }
        ],
        mobileAppRemoteOpeningPass: true,
        visitorRecordingPass: true,
        powerSupplyWiringCondition: 'PoE power supplied from central secure switch.',
        faults: []
      },

      // 7 | GARAGE DOOR
      garageDoors: {
        presence: 'Installed and fully functional',
        doorsCount: 2,
        openingType: 'Double',
        mechanicalType: 'Sectional',
        doorMaterial: 'Aluminium',
        dimensionsAndRating: '5.2m wide double sectional aluminium door',
        doorPhotos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60'],
        springsCounterbalanceCondition: 'Good',
        rollersHingesTracksCondition: 'Good',
        manualMovementBalanceTestPass: true,
        motorBrand: 'Centurion SDO4 Smart',
        motorModel: 'SDO4 T12 Heavy Duty',
        motorSerial: 'SDO4-99120',
        motorRating: 'Residential',
        driveMechanism: 'Belt drive',
        smartFunctionalityAvailable: true,
        motorLabelPhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60'],
        batteryBackupSpec: '24V (2x 12V 3.5Ah SLA)',
        remotesCount: 4,
        remoteModelsNotes: 'Centurion Nova 4-button rolling code remotes',
        wallConsolesFunctional: true,
        safetyBeamsOperational: true,
        externalKeypadOperational: false,
        courtesyLightOperational: true,
        functionalTests: {
          fullTravelPassed: true,
          openCloseLimitsPassed: true,
          obstructionReversalPassed: true,
          manualEmergencyReleasePassed: true,
          batteryBackupOperationPassed: true,
          mechanicalFaultSeparatedFromMotor: true
        },
        faults: []
      },

      // 8 | GATE MOTOR
      gateMotors: {
        presence: 'Installed and fully functional',
        gateType: 'Sliding',
        gatesCount: 1,
        gateMaterial: 'Galvanised Steel Palisade',
        dimensionsAndEstimatedWeight: '4.8m length, approximate weight 380kg',
        wheelsBearingsGroundTrackCondition: 'Good',
        rackType: 'Steel',
        guidesRollersEndStopsCondition: 'Good',
        levelAlignmentAndResistancePass: true,
        motorBrand: 'Centurion D5 Smart',
        motorModel: 'D5 Smart High Speed',
        motorSerial: 'D5S-2026-9938',
        motorCapacityKg: '500kg residential speed',
        motorPhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60'],
        controllerPcbCondition: 'Pristine, no insect ingress or moisture marks.',
        transformerPsuCondition: 'Operating at 27.4V DC charging rail.',
        batteryQtyAndCapacity: '2x 12V 7.2Ah SLA in series (24V System)',
        chargingVoltageCurrentReadings: 'Charging at 27.6V @ 1.2A float mode',
        gearboxOilGreaseCondition: 'Sealed oil bath with zero seepage',
        foundationMountingRigid: true,
        remotesCount: 6,
        gateBeamsType: 'Wireless',
        gateBeamsOperational: true,
        gateContactAlarmTriggerFunctional: true,
        intercomTriggerFunctional: true,
        pedestrianOpeningFunctional: true,
        autoCloseFunctional: true,
        courtesyLightFunctional: true,
        smartGsmWifiModuleFunctional: true,
        loopDetectorsFunctional: false,
        safetyEdgesFunctional: false,
        functionalTests: {
          openCloseCyclesPassed: true,
          obstructionBeamResponsePassed: true,
          manualKeyReleasePassed: true,
          backupBatterySpeedPassed: true
        },
        faults: []
      },

      // 9 | ELECTRIC FENCING
      electricFence: {
        presence: 'Installed and fully functional',
        energizersCount: 1,
        energizerBrand: 'Nemtek Druid (13 / 15 / 18 / 24)',
        energizerModel: 'Druid 15 LCD Energizer',
        energizerSerial: 'ND-15-7729',
        zonesCount: 1,
        outputJoulesRating: '4.6 Stored Joules / 3.0 Output Joules',
        psuBatteryCondition: '12V 7Ah SLA Battery in dedicated enclosure, good float.',
        energizerPhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60'],
        measuredFenceVoltageKv: 7.6,
        measuredEarthVoltageKv: 0.1,
        alarmsSirenKeypadAppFunctional: true,
        approximateFenceLengthMeters: 140,
        strandCount: 8,
        fenceHeightMeters: 1.2,
        wireMaterial: 'Aluminium',
        wireGaugeMm: '1.6mm Solid Aluminium',
        htCableRatingOk: true,
        bobbinsInsulatorsCondition: 'Good',
        staysTensionersSpringsCondition: 'Good',
        earthSpikesEarthingGridCondition: 'Compliant',
        vegetationClearanceCompliant: true,
        fenceGatesAndContactsOperational: true,
        warningLightsOperational: true,
        efscocCertificateAvailable: 'Yes',
        efscocCertificateNumber: 'EFSCOC-JHB-2025-0891',
        efscocCertificateDate: '2025-11-14',
        efscocInstallerDetails: 'Certified Electric Fence System Operator (EFSO 1182)',
        warningSignsEvery10mPass: true,
        fencePhotos: ['https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60'],
        faults: []
      },

      // 14 | BOOM GATES (Full Module)
      boomGates: {
        presence: isBusiness ? 'Installed and fully functional' : 'Not installed',
        boomGatesCount: isBusiness ? 1 : 0,
        units: isBusiness ? [
          {
            id: 'bg-1',
            entranceLaneName: 'Visitor Access Boom Gate Lane 1',
            direction: 'Inbound',
            location: 'Main Commercial Guardhouse Gate',
            manufacturer: 'Centurion Sector 3m / 4.5m / 6m',
            model: 'Sector 4.5m High Volume',
            controllerPcb: 'Sector Controller v2',
            serialNumber: 'SEC-45-9921',
            motorRatingDutyCycle: '24V DC Brushless 100% Continuous',
            boomArmLengthMeters: 4.5,
            boomArmMaterial: 'Octagonal Aluminium with Rubber Buffer',
            boomArmType: 'Straight',
            boomArmCondition: 'Good',
            balancingSpringCounterweightCondition: 'Balanced',
            pivotGearboxCabinetFixingPass: true,
            mainSupplyPsuUpsPass: true,
            batteryBackupSpec: '2x 12V 7Ah SLA Battery Backup',
            powerFailureOperationPass: true,
            vehicleLoopDetectorsPass: true,
            safetyPhotocellsBeamsPass: true,
            safetyEdgesPass: true,
            warningLightsSirenPass: true,
            emergencyStopButtonPass: true,
            manualOverrideReleasePass: true,
            breakawayArmFitted: true,
            accessControlReaderTriggerPass: true,
            intercomTriggerPass: true,
            remotesPushButtonsPass: true,
            licensePlateRecognitionLprPass: true,
            raiseLowerCyclesLimitsPass: true,
            operatingSpeedNormal: true,
            photos: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60'],
            testResult: 'Pass'
          }
        ] : [],
        faults: []
      },

      // 15 | TURNSTILES (Full Module)
      turnstiles: {
        presence: isBusiness ? 'Installed and fully functional' : 'Not installed',
        turnstilesCount: isBusiness ? 1 : 0,
        units: isBusiness ? [
          {
            id: 'turn-1',
            entryLocation: 'Staff Pedestrian Turnstile Gate',
            passageDirection: 'Bi-directional',
            turnstileType: 'Full-height (single)',
            manufacturer: 'Turnstar Trident / Tribune',
            model: 'Titan Full Height 4-Rotor',
            controllerPcb: 'Rotalok Solenoid Logic PCB',
            serialNumber: 'TTN-2025-412',
            indoorOutdoorUse: 'Outdoor sheltered',
            operationType: 'Electromechanical',
            mechanicsCondition: 'Smooth',
            readersIntegrationType: 'Biometric + RFID Card Reader',
            antiTailgatingOperational: true,
            countingLoggingOperational: true,
            fireAlarmEmergencyEvacuationReleasePass: true,
            powerFailureFreeExitPass: true,
            entryExitAuthorizedPass: true,
            entryDeniedAlarmPass: true,
            passageSensorsResponsePass: true,
            photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=60'],
            testResult: 'Pass'
          }
        ] : [],
        faults: []
      }
    },

    consolidatedFaults: [],
    totalPreMembershipRepairsZar: 0,
    technicianObservations: 'All essential security systems inspected device-by-device. Both visual inspection and physical operational walk-tests completed. Equipment identity and specification labels verified against manufacturer database.',
    optionalUpgradesRecommended: 'Recommend adding a secondary 12V 8Ah lithium battery backup to the alarm panel during next scheduled maintenance.',
    outcome: 'All good',

    memberAcknowledgement: {
      memberSigned: true,
      signatoryName: customerName,
      memberRefusalRecorded: false,
      acknowledgedAt: new Date().toISOString()
    },

    supervisorReview: {
      status: 'Pending Review',
      supervisorNotes: 'Awaiting technical supervisor verification.'
    },

    baselineLocked: false,
    changeHistory: [
      {
        date: new Date().toISOString(),
        author: contractor?.name || 'Assigned Technician',
        summary: 'Baseline technical assessment initiated and equipment register compiled.'
      }
    ],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
