/**
 * SAME DAY ASSIST
 * Technical Assessment & Member Equipment Register
 * Version 2.0 (24 October 2026)
 * Complete Software Engineering Types & Interfaces
 */

export type AssessmentSystemStatus =
  | 'Not installed'
  | 'Installed and fully functional'
  | 'Installed and partially functional'
  | 'Installed but not functional'
  | 'Installed but unable to test';

export type AssessmentOutcome =
  | 'All good'
  | 'Repairs required'
  | 'Further assessment required'
  | 'Declined pending correction';

export type FaultUrgency = 'Low' | 'Medium' | 'High' | 'Critical';

export type TestResultOutcome = 'Pass' | 'Fail' | 'Untested';

export interface ConditionalFault {
  id: string;
  systemName: string;
  componentOrDevice: string;
  exactSymptoms: string;
  testEvidencePhotoUrl?: string;
  reasonUntested?: string;
  recommendedWork: string;
  urgency: FaultUrgency;
  estimatedCost: number;
}

export interface MemberAppointmentInfo {
  legalFirstName: string;
  legalLastName: string;
  membershipId: string;
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  selectedPackage: 'Gold' | 'Platinum' | 'Diamond' | 'Business Essential' | 'Business Elite' | string;
  joinDate: string;
  appointmentDateTime: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  assignedTechnicianEmployeeId: string;
  status: 'Pending' | 'Scheduled' | 'In progress' | 'Follow-up' | 'Completed' | 'Reviewed';
  representativeContact?: {
    name: string;
    phone: string;
    relationshipOrTitle: string;
  };
  propertyAccessPermissionsGranted: boolean;
  accessPermissionNotes?: string;
}

export interface StructuredPropertyAddress {
  propertyType: 'House' | 'Townhouse' | 'Flat' | 'Estate' | 'Complex' | 'Business' | 'Other';
  estateOrComplexName?: string;
  buildingOrBlock?: string;
  unitOrStandNumber: string;
  streetNumber: string;
  streetName: string;
  suburb: string;
  city: string;
  regionOrServiceArea: string;
  province: string;
  postalCode: string;
  // Documented exception for addresses without street number
  hasNoStreetNumberException: boolean;
  noStreetNumberReason?: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  entranceGateToUse: string;
  gateAccessInstructions: string;
  parkingAndNavigationNotes?: string;
  propertyEntrancePhotoUrl?: string;
  visibleAddressStandPhotoUrl?: string;
  addressVerifiedWithMember: boolean;
}

// 3 | ALARM SYSTEMS
export interface AlarmExpanderItem {
  id: string;
  type: 'Onboard expansion' | 'Remote (hardwired) expander' | 'Wireless expander';
  makeModel: string;
  location: string;
  serialNumber: string;
  photoUrl?: string;
}

export interface AlarmKeypadItem {
  id: string;
  location: string;
  brandModel: string;
  type: 'LED' | 'LCD' | 'Touchscreen' | 'Other';
  connection: 'Wired' | 'Wireless';
  keypadTestPassed: boolean;
  backlightFunctional: boolean;
  tamperOperational: boolean;
  damageOrWaterIngress: 'None' | 'Minor Wear' | 'Water Ingress' | 'Physical Damage';
  photoUrl?: string;
}

export interface AlarmDetectorItem {
  id: string;
  zoneNumber: number;
  descriptiveName: string; // e.g. Front Door, Kitchen Beam
  location: string;
  type:
    | 'Door/window contacts'
    | 'PIR/pet-friendly PIR'
    | 'Indoor/outdoor/roof beams'
    | 'Trapdoor contacts'
    | 'Ceiling/roof-space sensors'
    | 'Glass-break'
    | 'Vibration/shock'
    | 'Panic buttons'
    | 'Smoke/heat detectors'
    | 'Perimeter detector'
    | 'Other';
  brandModel: string;
  connection: 'Wired' | 'Wireless';
  photoUrl?: string;
  testResult: TestResultOutcome;
  faultNotes?: string;
}

export interface AlarmZoneScheduleItem {
  zoneNumber: number;
  clientExistingName?: string;
  verifiedPhysicalName: string;
  status: 'Matched' | 'Bypassed' | 'Missing' | 'Renamed' | 'Untestable';
  discrepancyNote?: string;
}

export interface AlarmSystemAssessment {
  presence: AssessmentSystemStatus;
  panelBrand: string; // Paradox, IDS, DSC, Texecom, AJAX, Hikvision, etc.
  panelModel: string;
  panelFirmware?: string;
  panelSerialNumber: string;
  panelLocation: string;
  zonesSupported: number;
  zonesUsed: number;
  partitionsCount: number;
  enclosurePcbPhotos: string[];
  systemConfiguration: 'Fully wired' | 'Semi-wireless (hybrid)' | 'Fully wireless';
  expanders: AlarmExpanderItem[];
  mainsVoltageVAC?: number;
  chargingVoltageVDC?: number;
  batterySpec: string; // 12V 7Ah SLA, 12V 8Ah Lithium LiFePO4, etc.
  batteryCondition: 'Good' | 'Weak' | 'Dead' | 'Leaking' | 'Untested';
  batteryBackupTestPass: boolean;
  tamperFaultOk: boolean;
  faultIndicatorsPresent: string[];
  keypads: AlarmKeypadItem[];
  detectors: AlarmDetectorItem[];
  existingZoneListAvailable: 'Available' | 'Unavailable' | 'Supplied later';
  existingZoneListScanPhotoUrl?: string;
  walkTestCompleted: boolean;
  zoneSchedule: AlarmZoneScheduleItem[];
  functionalTests: {
    walkTestPassed: boolean;
    sirensStrobesFunctional: boolean;
    panicDevicesOperational: boolean;
    acLossBatteryBackupPassed: boolean;
    bypassTamperIndicatorsClear: boolean;
    eventLogChecked: boolean;
  };
  monitoringSignalPath: 'Radio' | 'GSM-LTE' | 'IP' | 'Telephone' | 'Other';
  monitoringTestSuccessful: boolean;
  mobileAppLinkageOperational: boolean;
  remoteArmDisarmVerified: boolean;
  faults: ConditionalFault[];
  recommendations?: string;
}

// 4 | CCTV SYSTEMS
export interface CctvCameraItem {
  id: string;
  cameraNumber: number;
  descriptiveName: string;
  location: string;
  brand: string;
  model: string;
  serialNumber?: string;
  signalType: 'Analogue' | 'IP' | 'PTZ';
  formFactor: 'Dome' | 'Bullet' | 'Turret' | 'Covert';
  resolutionMp: string; // 2MP, 4MP, 5MP, 8MP 4K
  lensMm: string; // 2.8mm, 4.0mm, 6.0mm, Varifocal
  nightVisionTech: 'IR LED' | 'Full-colour (ColorVu/etc)' | 'Low-light (DarkFighter)' | 'None';
  fixedOrVarifocal: 'Fixed' | 'Varifocal' | 'Motorized Zoom';
  audioSupport: 'Built-in mic' | 'External audio' | 'None';
  weatherRating: 'IP66' | 'IP67' | 'Indoor only' | 'IK10 vandal-proof';
  powerType: '12V DC' | 'PoE standard' | 'PoE+' | '24V AC';
  dayNightQualityPass: boolean;
  testResult: TestResultOutcome;
  blindSpotsOrDefects?: string;
  isVehicleLprAnpr: boolean;
  installedCameraPhotoUrl?: string;
  specLabelPhotoUrl?: string;
  liveViewScreenshotUrl?: string;
}

export interface CctvSystemAssessment {
  presence: AssessmentSystemStatus;
  recorderType: 'DVR' | 'NVR' | 'Hybrid' | 'Cloud';
  brand: string; // Hikvision, Dahua, Uniview, Provision, Axis, etc.
  model: string;
  firmwareVersion?: string;
  serialNumber: string;
  labelPhotos: string[];
  channelCapacity: number; // 4, 8, 16, 32, 64
  activeCamerasCount: number;
  spareChannelsCount: number;
  hddCount: number;
  individualHddCapacitiesTB: number[];
  totalStorageTB: number;
  driveHealth: 'Good' | 'Warning' | 'Failing' | 'Unknown';
  recordingMode: 'Continuous' | 'Motion' | 'Smart AI';
  recordingResolution: string;
  frameRateFps: number;
  verifiedRetentionDays: number;
  dateTimeAccurate: boolean;
  liveViewPlaybackExportTestPass: boolean;
  recorderPsuUpsBackupPass: boolean;
  cameras: CctvCameraItem[];
  cablingType: 'RG59 coaxial (LG59)' | 'RG59 coaxial' | 'Other coaxial' | 'CAT5e' | 'CAT6' | 'Fibre' | 'Wireless' | 'Other' | string;
  cablingCondition: 'Good' | 'Fair' | 'Exposed / Damaged' | 'Sub-standard';
  connectorsUsed: 'BNC' | 'Baluns' | 'RJ45' | 'Other';
  multiOutputPsuDetails?: string; // e.g. 9-way 10A fused
  poeSwitchPortCount?: number;
  internetConnectionRouterOk: boolean;
  mobileAppDisplaysThisPropertyVerified: boolean; // MANDATORY CHECK
  authorizedAppUsersCount: number;
  monitorsCount: number;
  monitorDetails?: string;
  monitorConnectionTypes: string[]; // HDMI, VGA, AV
  signalAccessoriesNotes?: string; // Splitters, extenders, KVM
  faults: ConditionalFault[];
  recommendations?: string;
}

// 5 | ACCESS CONTROL
export interface AccessControlReaderItem {
  id: string;
  type: 'Fingerprint' | 'Facial' | 'RFID card/tag/fob' | 'PIN' | 'Bluetooth/mobile' | 'Combination' | 'QR';
  doorLocation: string;
  makeModel: string;
  photoUrl?: string;
  testResult: TestResultOutcome;
}

export interface AccessControlLockItem {
  id: string;
  doorLocation: string;
  type:
    | 'Maglock'
    | 'Electric strike'
    | 'Solenoid/drop bolt'
    | 'Electromechanical lock'
    | 'Door contact'
    | 'Exit button'
    | 'Emergency break-glass release'
    | 'Door closer'
    | 'Fire alarm interface';
  holdingForceOrRating?: string; // 150kg, 280kg, 500kg
  testResult: TestResultOutcome;
}

export interface AccessControlAssessment {
  presence: AssessmentSystemStatus;
  controllerBrand: string; // ZKTeco, Impro, Paxton, Centurion, Suprema
  controllerModel: string;
  hardwareFirmwareVersion?: string;
  serialNumber: string;
  installedLocation: string;
  pcbLabelPhotos: string[];
  supportedDoorsCount: number;
  activeDoorsCount: number;
  topology: 'Standalone' | 'Networked' | 'Web-based' | 'Cloud';
  softwareNameVersion?: string;
  powerSupplyBackupPass: boolean;
  networkConnectionPass: boolean;
  readers: AccessControlReaderItem[];
  locks: AccessControlLockItem[];
  functionalTests: {
    entryExitTestPassed: boolean;
    lockUnlockOperational: boolean;
    powerFailureBehaviorPassed: boolean; // fail-safe or fail-secure
    emergencyReleaseBreakGlassPassed: boolean;
    doorOpenTamperAlertsPassed: boolean;
    logsReportingOperational: boolean;
    remoteManagementOperational: boolean;
  };
  faults: ConditionalFault[];
  recommendations?: string;
}

// 6 | INTERCOM SYSTEMS
export interface IntercomHandsetItem {
  id: string;
  location: string;
  model: string;
  isVideoMonitor: boolean; // Separate video monitors from audio handsets
  micSpeakerCallTestPass: boolean;
  screenDisplayPass: boolean;
  photoUrl?: string;
}

export interface IntercomOutputTriggerItem {
  outputType: 'Pedestrian gate' | 'Driveway gate' | 'Garage door' | 'Electric lock' | 'Access control' | 'Other';
  testedSeparately: boolean;
  testResult: TestResultOutcome;
}

export interface IntercomAssessment {
  presence: AssessmentSystemStatus;
  brand: string; // Commax, Kocom, Dahua, Hikvision, Centurion Polo, G-Speak
  model: string;
  systemType: 'Audio-only' | 'Video' | 'Mixed' | 'Video Doorbell';
  connectionType: 'Wired' | 'Wireless' | 'IP' | 'Wi-Fi';
  scale: 'Single residence' | 'Multi-unit';
  entranceStationPhotoUrl?: string;
  videoMonitorsCount: number;
  audioHandsetsCount: number;
  handsets: IntercomHandsetItem[];
  triggeredOutputs: IntercomOutputTriggerItem[];
  mobileAppRemoteOpeningPass: boolean;
  visitorRecordingPass: boolean;
  powerSupplyWiringCondition: string;
  faults: ConditionalFault[];
  recommendations?: string;
}

// 7 | GARAGE DOOR AUTOMATION
export interface GarageDoorAssessment {
  presence: AssessmentSystemStatus;
  doorsCount: number;
  openingType: 'Single' | 'Double' | 'Triple opening';
  mechanicalType: 'Sectional' | 'Roll-up' | 'Tip-up';
  doorMaterial: 'Wooden' | 'Steel' | 'Aluminium' | 'Zinc' | 'Other';
  dimensionsAndRating?: string;
  doorPhotos: string[];
  springsCounterbalanceCondition: 'Good' | 'Worn' | 'Imbalanced' | 'Dangerous';
  rollersHingesTracksCondition: 'Good' | 'Worn' | 'Misaligned' | 'Seized';
  manualMovementBalanceTestPass: boolean;
  motorBrand: string; // Centurion SDO4, DigiDoor, Marantec, Gemini
  motorModel: string;
  motorSerial: string;
  motorRating: 'Residential' | 'Commercial' | 'Industrial';
  driveMechanism: 'Chain drive' | 'Belt drive' | 'Shaft / Pole drive';
  smartFunctionalityAvailable: boolean;
  motorLabelPhotos: string[];
  batteryBackupSpec: string; // e.g. 24V (2x 12V 3.5Ah)
  remotesCount: number;
  remoteModelsNotes?: string;
  wallConsolesFunctional: boolean;
  safetyBeamsOperational: boolean;
  externalKeypadOperational: boolean;
  courtesyLightOperational: boolean;
  functionalTests: {
    fullTravelPassed: boolean;
    openCloseLimitsPassed: boolean;
    obstructionReversalPassed: boolean;
    manualEmergencyReleasePassed: boolean;
    batteryBackupOperationPassed: boolean;
    mechanicalFaultSeparatedFromMotor: boolean;
  };
  faults: ConditionalFault[];
  recommendations?: string;
}

// 8 | GATE MOTOR AUTOMATION
export interface GateMotorAssessment {
  presence: AssessmentSystemStatus;
  gateType: 'Sliding' | 'Swing' | 'Telescopic' | 'Other';
  gatesCount: number;
  gateMaterial: string; // Palisade, Steel Sheet, Wood, Wrought Iron
  dimensionsAndEstimatedWeight?: string;
  wheelsBearingsGroundTrackCondition: 'Good' | 'Worn' | 'Damaged' | 'Debris on Track';
  rackType: 'Nylon' | 'Steel';
  guidesRollersEndStopsCondition: 'Good' | 'Worn' | 'Missing End Stop';
  levelAlignmentAndResistancePass: boolean;
  motorBrand: string; // Centurion D5 Evo, D10 Smart, ET Nice, Gemini, Hansa
  motorModel: string;
  motorSerial: string;
  motorCapacityKg?: string;
  motorPhotos: string[];
  controllerPcbCondition: string;
  transformerPsuCondition: string;
  batteryQtyAndCapacity: string; // e.g. 1x 12V 7.2Ah SLA or Lithium
  chargingVoltageCurrentReadings?: string;
  diagnosticsFaultCodes?: string;
  gearboxOilGreaseCondition: string;
  foundationMountingRigid: boolean;
  remotesCount: number;
  gateBeamsType: 'Wired' | 'Wireless' | 'None';
  gateBeamsOperational: boolean;
  gateContactAlarmTriggerFunctional: boolean;
  intercomTriggerFunctional: boolean;
  pedestrianOpeningFunctional: boolean;
  autoCloseFunctional: boolean;
  courtesyLightFunctional: boolean;
  smartGsmWifiModuleFunctional: boolean;
  loopDetectorsFunctional: boolean;
  safetyEdgesFunctional: boolean;
  functionalTests: {
    openCloseCyclesPassed: boolean;
    obstructionBeamResponsePassed: boolean;
    manualKeyReleasePassed: boolean;
    backupBatterySpeedPassed: boolean;
  };
  faults: ConditionalFault[];
  recommendations?: string;
}

// 9 | ELECTRIC FENCING
export interface ElectricFenceAssessment {
  presence: AssessmentSystemStatus;
  energizersCount: number;
  energizerBrand: string; // Nemtek Druid, Merlin Stealth, Stafix, JVA
  energizerModel: string;
  energizerSerial: string;
  zonesCount: number;
  outputJoulesRating?: string;
  psuBatteryCondition: string;
  energizerPhotos: string[];
  measuredFenceVoltageKv: number; // e.g. 7.5 kV
  measuredEarthVoltageKv: number; // e.g. 0.2 kV
  alarmsSirenKeypadAppFunctional: boolean;
  approximateFenceLengthMeters: number;
  strandCount: number;
  fenceHeightMeters: number;
  wireMaterial: 'Aluminium' | 'Stainless steel' | 'Galvanised' | 'Braided' | 'Solid' | 'Other';
  wireGaugeMm?: string;
  htCableRatingOk: boolean;
  bobbinsInsulatorsCondition: 'Good' | 'Cracked' | 'Arcing' | 'Damaged';
  staysTensionersSpringsCondition: 'Good' | 'Loose' | 'Rusted';
  earthSpikesEarthingGridCondition: 'Compliant' | 'Sub-standard' | 'Inadequate';
  vegetationClearanceCompliant: boolean;
  fenceGatesAndContactsOperational: boolean;
  warningLightsOperational: boolean;
  efscocCertificateAvailable: 'Yes' | 'No' | 'Not provided';
  efscocCertificateNumber?: string;
  efscocCertificateDate?: string;
  efscocInstallerDetails?: string;
  efscocPhotoUrl?: string;
  warningSignsEvery10mPass: boolean;
  suspectedNonComplianceNotes?: string;
  fencePhotos: string[];
  faults: ConditionalFault[];
  recommendations?: string;
}

// 14 | BOOM GATE SYSTEMS (Full Dedicated Assessment - Addendum page 6)
export interface BoomGateUnitItem {
  id: string;
  entranceLaneName: string; // e.g. Main Inbound Lane, Resident Exit
  direction: 'Inbound' | 'Outbound' | 'Bi-directional';
  location: string;
  manufacturer: string; // Centurion Sector, Magnetic Access, CAME, BFT, Nice
  model: string;
  series?: string;
  firmwareVersion?: string;
  controllerPcb: string;
  serialNumber: string;
  motorRatingDutyCycle: string; // e.g. 24V DC 100% Continuous
  boomArmLengthMeters: number;
  boomArmMaterial: string; // Aluminium round/octagonal, Carbon
  boomArmType: 'Straight' | 'Articulated (folding)' | 'Fence-skirt / curtain';
  boomArmCondition: 'Good' | 'Bent' | 'Impact Damage' | 'Loose';
  balancingSpringCounterweightCondition: 'Balanced' | 'Worn' | 'Imbalanced';
  pivotGearboxCabinetFixingPass: boolean;
  mainSupplyPsuUpsPass: boolean;
  batteryBackupSpec: string;
  powerFailureOperationPass: boolean;
  vehicleLoopDetectorsPass: boolean;
  safetyPhotocellsBeamsPass: boolean;
  safetyEdgesPass: boolean;
  warningLightsSirenPass: boolean;
  emergencyStopButtonPass: boolean;
  manualOverrideReleasePass: boolean;
  breakawayArmFitted: boolean;
  accessControlReaderTriggerPass: boolean;
  intercomTriggerPass: boolean;
  remotesPushButtonsPass: boolean;
  licensePlateRecognitionLprPass: boolean;
  raiseLowerCyclesLimitsPass: boolean;
  operatingSpeedNormal: boolean;
  photos: string[];
  testResult: TestResultOutcome;
  defectsNotes?: string;
}

export interface BoomGateSystemAssessment {
  presence: AssessmentSystemStatus;
  boomGatesCount: number;
  units: BoomGateUnitItem[];
  faults: ConditionalFault[];
  recommendations?: string;
}

// 15 | TURNSTILE SYSTEMS (Full Dedicated Assessment - Addendum page 6)
export interface TurnstileUnitItem {
  id: string;
  entryLocation: string; // e.g. Pedestrian Turnstile 1, Gym Entrance
  passageDirection: 'Single' | 'Bi-directional';
  turnstileType: 'Tripod' | 'Full-height (single)' | 'Full-height (double)' | 'Waist-high' | 'Speed gate (glass)' | 'Other';
  manufacturer: string; // Turnstar, Boon Edam, ZKTeco, Centurion, Gunnebo
  model: string;
  series?: string;
  controllerPcb: string;
  firmwareVersion?: string;
  serialNumber: string;
  indoorOutdoorUse: 'Indoor' | 'Outdoor sheltered' | 'Outdoor exposed';
  operationType: 'Mechanical' | 'Electromechanical';
  mechanicsCondition: 'Smooth' | 'Sticky' | 'Noisy' | 'Seized';
  readersIntegrationType: string; // Biometric, Card, PIN, QR
  antiTailgatingOperational: boolean;
  countingLoggingOperational: boolean;
  fireAlarmEmergencyEvacuationReleasePass: boolean; // MANDATORY SAFETY CHECK
  powerFailureFreeExitPass: boolean;
  entryExitAuthorizedPass: boolean;
  entryDeniedAlarmPass: boolean;
  passageSensorsResponsePass: boolean;
  photos: string[];
  testResult: TestResultOutcome;
  defectsNotes?: string;
}

export interface TurnstileSystemAssessment {
  presence: AssessmentSystemStatus;
  turnstilesCount: number;
  units: TurnstileUnitItem[];
  faults: ConditionalFault[];
  recommendations?: string;
}

// COMPLETE TECHNICAL ASSESSMENT REPORT & EQUIPMENT REGISTER
export interface TechnicalAssessmentReport {
  id: string;
  assessmentId: string;
  enquiryId: string;
  customerId: string;
  customerName: string;
  accountType: 'House' | 'Townhouse' | 'Flat' | 'Estate' | 'Complex' | 'Business' | 'Other';
  version: '2.0';
  assessmentDate: string;
  memberInfo: MemberAppointmentInfo;
  addressInfo: StructuredPropertyAddress;
  systems: {
    alarm: AlarmSystemAssessment;
    cctv: CctvSystemAssessment;
    accessControl: AccessControlAssessment;
    intercom: IntercomAssessment;
    garageDoors: GarageDoorAssessment;
    gateMotors: GateMotorAssessment;
    electricFence: ElectricFenceAssessment;
    boomGates: BoomGateSystemAssessment;
    turnstiles: TurnstileSystemAssessment;
  };
  consolidatedFaults: ConditionalFault[];
  totalPreMembershipRepairsZar: number;
  technicianObservations: string;
  optionalUpgradesRecommended?: string;
  outcome: AssessmentOutcome;
  memberAcknowledgement: {
    memberSigned: boolean;
    signatoryName: string;
    signatureDataUrl?: string;
    memberRefusalRecorded: boolean;
    refusalReason?: string;
    acknowledgedAt: string;
  };
  supervisorReview: {
    status: 'Pending Review' | 'Approved' | 'Returned for Correction';
    supervisorName?: string;
    reviewedAt?: string;
    supervisorNotes?: string;
  };
  baselineLocked: boolean;
  baselineLockedAt?: string;
  changeHistory: Array<{
    date: string;
    author: string;
    summary: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
