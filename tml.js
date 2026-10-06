/* =====================================================================
   TML (Tata Motors) Retarder — ECS CAN Box Blink Code Diagnostics
   Self-contained module for TML diagnostic steps flow.
   ===================================================================== */
(function () {
  "use strict";

  
  const TML_SECTION_INFO = {
    'phase_1': {
      locationImg: 'asset/optimized/tata.png.png',
      locationDesc: 'Instrument cluster in front of the driver. Check the retarder and warning indicators with ignition ON.'
    },
    'phase_2': {
      locationImg: 'asset/optimized/tata.png.png',
      locationDesc: 'Observe the cluster warning lamp or diagnostic indicator during the blink-code check.'
    },
    'phase_3': {
      locationImg: 'asset/optimized/ecuspeedbox.jpg',
      locationDesc: 'Located near the chassis or cabin depending on the vehicle variant.',
      pinoutImg: 'asset/veh_ecu_pinout.png'
    },
    'phase_4': {
      locationImg: 'asset/optimized/customermatingconnector.jpg',
      locationDesc: '8-Pin Customer Mating Connector.',
      pinoutImg: 'asset/8pin_connector_pinout.png'
    },
    'phase_5': {
      locationImg: 'asset/optimized/retarderassy.jpg',
      locationDesc: 'Retarder assembly mounted on the driveline. Follow workshop safety procedures before inspection.'
    }
  };

  const TML_PHASE_META = {
    phase_1: { tone: 'blue', requirements: [['ignition', 'Ignition ON']] },
    phase_2: { tone: 'purple', requirements: [['ignition', 'Ignition ON'], ['blink', 'Blink-code / ECU']] },
    phase_3: { tone: 'blue', requirements: [['ignition', 'Ignition ON'], ['connector', 'Connector connected'], ['meter', 'Multimeter required']] },
    phase_4: { tone: 'blue', requirements: [['connector', 'Connector connected'], ['meter', 'Multimeter required']] },
    phase_5: { tone: 'yellow', requirements: [['engine', 'Engine running'], ['safety', 'Safety inspection']] }
  };

  const MAIN_PHASES = [
    { id: 'phase_1', labelKey: 'tml_phase_cluster', icon: '🖥️' },
    { id: 'phase_2', labelKey: 'tml_phase_blink', icon: '💡' },
    { id: 'phase_3', labelKey: 'tml_phase_ecs', icon: '📦' },
    { id: 'phase_4', labelKey: 'tml_phase_connector', icon: '🔌' },
    { id: 'phase_5', labelKey: 'tml_phase_retarder', icon: '🛣️' }
  ];

  const BLINK_CODES = {
    1: { desc: 'Open Circuit / No Output from Power Output 1', cause: 'Output 1 wire open', action: 'Repair harness/connector/grommet', priority: 2 },
    2: { desc: 'Open Circuit / No Output from Power Output 2', cause: 'Output 2 wire open', action: 'Repair harness', priority: 2 },
    3: { desc: 'Open Circuit / No Output from Power Output 3', cause: 'Output 3 wire open', action: 'Repair harness', priority: 2 },
    4: { desc: 'Open Circuit / No Output from Power Output 4', cause: 'Output 4 wire open', action: 'Repair harness', priority: 2 },
    5: { desc: 'Short Circuit / Continuous Output from Power Output 1', cause: 'Output 1 short circuit', action: 'Repair short circuit', priority: 2 },
    6: { desc: 'Short Circuit / Continuous Output from Power Output 2', cause: 'Output 2 short circuit', action: 'Repair short circuit', priority: 2 },
    7: { desc: 'Short Circuit / Continuous Output from Power Output 3', cause: 'Output 3 short circuit', action: 'Repair short circuit', priority: 2 },
    8: { desc: 'Short Circuit / Continuous Output from Power Output 4', cause: 'Output 4 short circuit', action: 'Repair short circuit', priority: 2 },
    9: { desc: 'Vehicle Controller CAN Input Not Available', cause: 'Vehicle Controller CAN Communication Failure', action: 'Repair CAN network', priority: 3 },
    10: { desc: 'Vehicle Speed Signal Missing (CAN)', cause: 'Vehicle Speed CAN Signal Missing', action: 'Check vehicle speed sensor / CAN', priority: 3 },
    11: { desc: 'ABS Interlock Signal Missing (CAN)', cause: 'ABS Interlock CAN Failure', action: 'Check ABS CAN communication', priority: 3 },
    12: { desc: 'Accelerator Pedal Position Missing (CAN)', cause: 'Accelerator Pedal CAN Signal Missing', action: 'Check Accelerator CAN', priority: 3 },
    13: { desc: 'Brake Switch Signal Missing (CAN)', cause: 'Brake Switch CAN Signal Missing', action: 'Check Brake Switch CAN', priority: 3 },
    14: { desc: 'EBS Brake Switch Signal Missing (CAN)', cause: 'EBS Brake Switch CAN Failure', action: 'Check EBS CAN', priority: 3 },
    15: { desc: 'ABS Fault Signal Active / Missing', cause: 'ABS Fault Signal Active / Missing', action: 'Check ABS ECU / clear ABS fault', priority: 3 },
    16: { desc: 'Reserved', cause: 'Reserved', action: 'Contact Technical Service', priority: 4 },
    17: { desc: 'Transil Diode 1 Fault', cause: 'Transil Diode 1 Shorted', action: 'Replace TVS Diode Assembly Unit (BIPL: 98600140 / TML: 516554600196)', priority: 1, extraCheck: 'Continuity present across TVS Diode 1?' },
    18: { desc: 'Transil Diode 1 Fault', cause: 'Transil Diode 1 Shorted', action: 'Replace TVS Diode Assembly Unit (BIPL: 98600140 / TML: 516554600196)', priority: 1, extraCheck: 'Continuity present across TVS Diode 1?' },
    19: { desc: 'Transil Diode 2 Fault', cause: 'Transil Diode 2 Shorted', action: 'Replace TVS Diode Assembly Unit (BIPL: 98600140 / TML: 516554600196)', priority: 1, extraCheck: 'Continuity present across TVS Diode 2?' },
    20: { desc: 'Transil Diode 2 Fault', cause: 'Transil Diode 2 Shorted', action: 'Replace TVS Diode Assembly Unit (BIPL: 98600140 / TML: 516554600196)', priority: 1, extraCheck: 'Continuity present across TVS Diode 2?' }
  };

  const STEPS = {
    // --- Phase 1: Cluster Check ---
    cluster_check: {
      phase: 0,
      titleKey: 'tml_cluster_title',
      questionKey: 'tml_cluster_q',
      type: 'multi_select_cluster',
      options: [
        { labelKey: 'tml_opt_abs', next: 'stop_abs_fault' },
        { labelKey: 'tml_opt_hsa', next: 'stop_hsa_fault' },
        { labelKey: 'tml_opt_slip', next: 'stop_slip_fault' },
        { labelKey: 'tml_opt_retarder', next: 'blink_code_check' },
        { labelKey: 'tml_opt_no_error', next: 'ecs_step_3_1' }
      ]
    },
    stop_abs_fault: { phase: 0, titleKey: 'tml_stop_abs_title', type: 'end', actionKey: 'tml_stop_abs_action', pass: false },
    stop_hsa_fault: { phase: 0, titleKey: 'tml_stop_hsa_title', type: 'end', actionKey: 'tml_stop_hsa_action', pass: false },
    stop_slip_fault: { phase: 0, titleKey: 'tml_stop_slip_title', type: 'end', actionKey: 'tml_stop_slip_action', pass: false },

    // --- Phase 2: Blink Code ---
    blink_code_check: {
      phase: 1,
      title: 'Blink Code Check',
      question: 'Is Blink Code Available?',
      type: 'yes_no',
      yes: 'blink_code_select',
      no: 'ecs_step_3_1'
    },
    blink_code_select: {
      phase: 1,
      titleKey: 'tml_select_blink_title',
      subtitleKey: 'tml_select_blink_sub',
      questionKey: 'tml_select_blink_q',
      type: 'multi_select',
      // Logic handled dynamically in handleAnswer
    },
    blink_code_repair: {
      phase: 1,
      title: 'Blink Code Repair',
      type: 'blink_repair'
    },

    // --- Phase 3: ECS Box Assembly ---
    ecs_step_3_1: {
      phase: 2,
      titleKey: 'tml_ecs_3_1_title',
      questionKey: 'tml_ecs_3_1_q',
      type: 'yes_no',
      yes: 'ecs_step_3_2',
      no: 'end_ecs_3_1'
    },
    end_ecs_3_1: { phase: 2, titleKey: 'tml_end_ecs_3_1_title', type: 'end', actionKey: 'tml_end_ecs_3_1_action', pass: false },

    ecs_step_3_2: {
      phase: 2,
      titleKey: 'tml_ecs_3_2_title',
      questionKey: 'tml_ecs_3_2_q',
      type: 'yes_no',
      yes: 'ecs_step_3_3',
      no: 'end_ecs_3_2'
    },
    end_ecs_3_2: { phase: 2, titleKey: 'tml_end_ecs_3_2_title', type: 'end', actionKey: 'tml_end_ecs_3_2_action', pass: false,
    recommendedParts: [
      { brand: 'BIPL', number: '98953061' },
      { brand: 'TML', number: '516554800195' }
    ]},

    ecs_step_3_3: {
      phase: 2,
      titleKey: 'tml_ecs_3_3_title',
      questionKey: 'tml_ecs_3_3_q',
      type: 'yes_no',
      yes: 'ecs_step_3_4',
      no: 'end_ecs_3_3'
    },
    end_ecs_3_3: { phase: 2, titleKey: 'tml_end_ecs_3_3_title', type: 'end', actionKey: 'tml_end_ecs_3_3_action', pass: false,
    recommendedParts: [
      { brand: 'BIPL', number: '98600141' },
      { brand: 'TML', number: '516554504904' }
    ]},

    ecs_step_3_4: {
      phase: 2,
      titleKey: 'tml_ecs_3_4_title',
      questionKey: 'tml_ecs_3_4_q',
      type: 'yes_no',
      yes: 'ecs_step_3_5',
      no: 'end_ecs_3_4'
    },
    end_ecs_3_4: { phase: 2, titleKey: 'tml_end_ecs_3_4_title', type: 'end', actionKey: 'tml_end_ecs_3_4_action', pass: false },

    ecs_step_3_5: {
      phase: 2,
      titleKey: 'tml_ecs_3_5_title',
      questionKey: 'tml_ecs_3_5_q',
      type: 'yes_no',
      yes: 'veh_pin1',
      no: 'end_ecs_3_5'
    },
    end_ecs_3_5: { phase: 2, titleKey: 'tml_end_ecs_3_5_title', type: 'end', actionKey: 'tml_end_ecs_3_5_action', pass: false },

    // --- Phase 4: Vehicle 8-Pin Connector ---
    veh_pin1: {
        phase: 3, progress: {current: 1, total: 6}, hint: 'Check CAN High at Pin 1. Expected: > 2.5V.', pins: [{label: 'Pin 1 (Yellow)', color: 'yellow'}],
        titleKey: 'tml_veh_pin1_title',
      questionKey: 'tml_veh_pin1_q',
      type: 'yes_no',
      yes: 'veh_pin2',
      no: 'end_pin1'
    },
    end_pin1: { phase: 3, titleKey: 'tml_end_pin1_title', type: 'end', actionKey: 'tml_end_pin1_action', pass: false },

    veh_pin2: {
        phase: 3, progress: {current: 2, total: 6}, hint: 'Check CAN Low at Pin 2. Expected: < 2.5V.', pins: [{label: 'Pin 2 (Green)', color: 'green'}],
        titleKey: 'tml_veh_pin2_title',
      questionKey: 'tml_veh_pin2_q',
      type: 'yes_no',
      yes: 'veh_pin3',
      no: 'end_pin2'
    },
    end_pin2: { phase: 3, titleKey: 'tml_end_pin2_title', type: 'end', actionKey: 'tml_end_pin2_action', pass: false },

    veh_pin3: {
        phase: 3, progress: {current: 3, total: 6}, hint: 'Check Ignition Input at Pin 3. Expected: 24V.', pins: [{label: 'Pin 3 (Red)', color: 'red'}],
        titleKey: 'tml_veh_pin3_title',
      questionKey: 'tml_veh_pin3_q',
      type: 'yes_no',
      yes: 'veh_pin4',
      no: 'end_pin3'
    },
    end_pin3: { phase: 3, titleKey: 'tml_end_pin3_title', type: 'end', actionKey: 'tml_end_pin3_action', pass: false },

    veh_pin4: {
        phase: 3, progress: {current: 4, total: 6}, hint: 'Turn Retarder Switch ON. Check voltage at Pin 4. Expected: 24V.', pins: [{label: 'Pin 4 (Violet)', color: 'violet'}],
        titleKey: 'tml_veh_pin4_title',
      questionKey: 'tml_veh_pin4_q',
      type: 'yes_no',
      yes: 'veh_pin5',
      no: 'veh_pin4_secondary'
    },
    veh_pin4_secondary: {
      phase: 3,
      titleKey: 'tml_veh_pin4_sec_title',
      questionKey: 'tml_veh_pin4_sec_q',
      type: 'yes_no',
      yes: 'end_pin4_switch_ok',
      no: 'end_pin4_switch_fault'
    },
    end_pin4_switch_ok: { phase: 3, titleKey: 'tml_end_pin4_sw_ok_title', type: 'end', actionKey: 'tml_end_pin4_sw_ok_action', pass: false },
    end_pin4_switch_fault: { phase: 3, titleKey: 'tml_end_pin4_sw_fault_title', type: 'end', actionKey: 'tml_end_pin4_sw_fault_action', pass: false },

    veh_pin5: {
        phase: 3, progress: {current: 5, total: 6}, hint: 'Check continuity to vehicle negative at Pin 5.', pins: [{label: 'Pin 5 (Black)', color: 'black'}],
        titleKey: 'tml_veh_pin5_title',
      questionKey: 'tml_veh_pin5_q',
      type: 'yes_no',
      yes: 'veh_pin8',
      no: 'end_pin5'
    },
    end_pin5: { phase: 3, titleKey: 'tml_end_pin5_title', type: 'end', actionKey: 'tml_end_pin5_action', pass: false },

    veh_pin8: {
        phase: 3, progress: {current: 6, total: 6}, hint: 'Check continuity to vehicle negative at Pin 8.', pins: [{label: 'Pin 8 (Black)', color: 'black'}],
        titleKey: 'tml_veh_pin8_title',
      questionKey: 'tml_veh_pin8_q',
      type: 'yes_no',
      yes: 'retarder_trial_1',
      no: 'end_pin8'
    },
    end_pin8: { phase: 3, titleKey: 'tml_end_pin8_title', type: 'end', actionKey: 'tml_end_pin8_action', pass: false },

    // --- Phase 5: Retarder Functional Trial ---
    retarder_trial_1: {
      phase: 4,
      titleKey: 'tml_trial_1_title',
      subtitleKey: 'tml_trial_1_sub',
      questionKey: 'tml_trial_1_q',
      type: 'yes_no',
      yes: 'retarder_trial_2',
      no: 'retarder_not_engaging'
    },
    retarder_not_engaging: {
      phase: 4,
      titleKey: 'tml_not_engaging_title',
      questionKey: 'tml_not_engaging_q',
      type: 'yes_no',
      yes: 'end_sol_ok',
      no: 'solenoid_valve_1'
    },
    retarder_trial_2: {
      phase: 4,
      titleKey: 'tml_trial_2_title',
      questionKey: 'tml_trial_2_q',
      type: 'yes_no',
      yes: 'retarder_trial_3',
      no: 'retarder_trial_3'
    },
    retarder_trial_3: {
      phase: 4,
      titleKey: 'tml_trial_3_title',
      subtitleKey: 'tml_trial_3_sub',
      questionKey: 'tml_trial_3_q',
      type: 'yes_no',
      yes: 'pressure_switch_1',
      no: 'end_success'
    },
    end_success: {
      phase: 4,
      titleKey: 'tml_end_success_title', type: 'end', actionKey: 'tml_end_success_action', pass: true
    },

    pressure_switch_1: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      questionKey: 'tml_ps1_q',
      type: 'yes_no',
      yes: 'pressure_switch_2',
      no: 'end_ps_1'
    },
    end_ps_1: { phase: 4, titleKey: 'tml_end_ps1_title', type: 'end', actionKey: 'tml_end_ps1_action', pass: false },

    pressure_switch_2: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      questionKey: 'tml_ps2_q',
      type: 'yes_no',
      yes: 'pressure_switch_3',
      no: 'end_ps_2'
    },
    end_ps_2: { phase: 4, titleKey: 'tml_end_ps2_title', type: 'end', actionKey: 'tml_end_ps2_action', pass: false },

    pressure_switch_3: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      questionKey: 'tml_ps3_q',
      type: 'yes_no',
      yes: 'pressure_switch_4',
      no: 'end_ps_3'
    },
    end_ps_3: { phase: 4, titleKey: 'tml_end_ps3_title', type: 'end', actionKey: 'tml_end_ps3_action', pass: false },

    pressure_switch_4: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      subtitleKey: 'tml_ps4_sub',
      questionKey: 'tml_ps4_q',
      type: 'yes_no',
      yes: 'end_ps_4',
      no: 'pressure_switch_5'
    },
    end_ps_4: { phase: 4, titleKey: 'tml_end_ps4_title', type: 'end', actionKey: 'tml_end_ps4_action', pass: false },

    pressure_switch_5: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      subtitleKey: 'tml_ps5_sub',
      questionKey: 'tml_ps5_q',
      type: 'yes_no',
      yes: 'pressure_switch_6',
      no: 'solenoid_valve_1'
    },
    solenoid_valve_1: {
      phase: 4,
      titleKey: 'tml_sol1_title',
      questionKey: 'tml_sol1_q',
      type: 'yes_no',
      yes: 'solenoid_valve_2',
      no: 'end_sol_1'
    },
    end_sol_1: { phase: 4, titleKey: 'tml_end_sol1_title', type: 'end', actionKey: 'tml_end_sol1_action', pass: false },

    solenoid_valve_2: {
      phase: 4,
      titleKey: 'tml_sol1_title',
      questionKey: 'tml_sol2_q',
      type: 'yes_no',
      yes: 'end_sol_ok',
      no: 'end_sol_2'
    },
    end_sol_2: { phase: 4, titleKey: 'tml_end_sol2_title', type: 'end', actionKey: 'tml_end_sol2_action', pass: false },
    end_sol_ok: { phase: 4, titleKey: 'tml_end_sol_ok_title', type: 'end', actionKey: 'tml_end_sol_ok_action', pass: false },

    pressure_switch_6: {
      phase: 4,
      titleKey: 'tml_ps1_title',
      questionKey: 'tml_ps6_q',
      type: 'yes_no',
      yes: 'end_ps_switch_stuck',
      no: 'end_ps_6'
    },
    end_ps_6: { phase: 4, titleKey: 'tml_end_ps6_title', type: 'end', actionKey: 'tml_end_ps6_action', pass: false },
    end_ps_switch_stuck: { phase: 4, titleKey: 'tml_end_ps_stuck_title', type: 'end', actionKey: 'tml_end_ps_stuck_action', pass: false },

    blink_1_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '1',
      questionKeyDynamic: 'tml_blink_check_q',
      type: 'yes_no', yes: 'blink_1_fault', no: 'blink_1_analysis_req'
    },
    blink_1_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '1', type: 'end', actionKey: 'tml_open_circuit_action', pass: false },
    blink_1_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '1', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_2_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '2',
      questionKeyDynamic: 'tml_blink_check_q',
      type: 'yes_no', yes: 'blink_2_fault', no: 'blink_2_analysis_req'
    },
    blink_2_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '2', type: 'end', actionKey: 'tml_open_circuit_action', pass: false },
    blink_2_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '2', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_3_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '3',
      questionKeyDynamic: 'tml_blink_check_q',
      type: 'yes_no', yes: 'blink_3_fault', no: 'blink_3_analysis_req'
    },
    blink_3_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '3', type: 'end', actionKey: 'tml_open_circuit_action', pass: false },
    blink_3_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '3', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_4_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '4',
      questionKeyDynamic: 'tml_blink_check_q',
      type: 'yes_no', yes: 'blink_4_fault', no: 'blink_4_analysis_req'
    },
    blink_4_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '4', type: 'end', actionKey: 'tml_open_circuit_action', pass: false },
    blink_4_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '4', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_5_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '5',
      questionKey: 'tml_blink_short_q',
      type: 'yes_no', yes: 'blink_5_fault', no: 'blink_5_analysis_req'
    },
    blink_5_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '5', type: 'end', actionKey: 'tml_short_circuit_action', pass: false },
    blink_5_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '5', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_6_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '6',
      questionKey: 'tml_blink_short_q',
      type: 'yes_no', yes: 'blink_6_fault', no: 'blink_6_analysis_req'
    },
    blink_6_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '6', type: 'end', actionKey: 'tml_short_circuit_action', pass: false },
    blink_6_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '6', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_7_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '7',
      questionKey: 'tml_blink_short_q',
      type: 'yes_no', yes: 'blink_7_fault', no: 'blink_7_analysis_req'
    },
    blink_7_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '7', type: 'end', actionKey: 'tml_short_circuit_action', pass: false },
    blink_7_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '7', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_8_investigation: {
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '8',
      questionKey: 'tml_blink_short_q',
      type: 'yes_no', yes: 'blink_8_fault', no: 'blink_8_analysis_req'
    },
    blink_8_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '8', type: 'end', actionKey: 'tml_short_circuit_action', pass: false },
    blink_8_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '8', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_9_investigation: {
      phase: 1, titleKey: 'tml_b9_title',
      questionKey: 'tml_b9_q',
      type: 'yes_no', yes: 'blink_9_analysis_req', no: 'blink_9_fault'
    },
    blink_9_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '9', type: 'end', actionKey: 'tml_b9_fault_action', pass: false },
    blink_9_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '9', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_10_investigation: {
      phase: 1, titleKey: 'tml_b10_title',
      questionKey: 'tml_b10_q',
      type: 'yes_no', yes: 'blink_10_analysis_req', no: 'blink_10_fault'
    },
    blink_10_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '10', type: 'end', actionKey: 'tml_b10_fault_action', pass: false },
    blink_10_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '10', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_11_investigation: {
      phase: 1, titleKey: 'tml_b11_title',
      questionKey: 'tml_b11_q',
      type: 'yes_no', yes: 'blink_11_analysis_req', no: 'blink_11_fault'
    },
    blink_11_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '11', type: 'end', actionKey: 'tml_b11_fault_action', pass: false },
    blink_11_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '11', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_12_investigation: {
      phase: 1, titleKey: 'tml_b12_title',
      questionKey: 'tml_b12_q',
      type: 'yes_no', yes: 'blink_12_analysis_req', no: 'blink_12_fault'
    },
    blink_12_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '12', type: 'end', actionKey: 'tml_b12_fault_action', pass: false },
    blink_12_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '12', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_13_investigation: {
      phase: 1, titleKey: 'tml_b13_title',
      questionKey: 'tml_b13_q',
      type: 'yes_no', yes: 'blink_13_analysis_req', no: 'blink_13_fault'
    },
    blink_13_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '13', type: 'end', actionKey: 'tml_b13_fault_action', pass: false },
    blink_13_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '13', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_14_investigation: {
      phase: 1, titleKey: 'tml_b14_title',
      questionKey: 'tml_b14_q',
      type: 'yes_no', yes: 'blink_14_analysis_req', no: 'blink_14_fault'
    },
    blink_14_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '14', type: 'end', actionKey: 'tml_b14_fault_action', pass: false },
    blink_14_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '14', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_15_investigation: {
      phase: 1, titleKey: 'tml_b15_title',
      questionKey: 'tml_b15_q',
      type: 'yes_no', yes: 'blink_15_fault', no: 'blink_15_analysis_req'
    },
    blink_15_fault: { phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '15', type: 'end', actionKey: 'tml_b15_fault_action', pass: false },
    blink_15_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '15', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_16_investigation: { phase: 1, titleKey: 'tml_b16_title', type: 'end', actionKey: 'tml_b16_action', pass: false },

    blink_17_investigation: {
      phase: 1, titleKey: 'tml_b17_title',
      questionKey: 'tml_transil_q',
      type: 'yes_no', yes: 'blink_17_fault', no: 'blink_17_analysis_req'
    },
    blink_17_fault: { 
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '17', type: 'end',
      actionKey: 'tml_transil1_fault_action',
      pass: false,
      recommendedParts: [{ brand: 'BIPL', number: '98600140' }, { brand: 'TML', number: '516554600196' }]
    },
    blink_17_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '17', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_18_investigation: {
      phase: 1, titleKey: 'tml_b18_title',
      questionKey: 'tml_transil_q',
      type: 'yes_no', yes: 'blink_18_fault', no: 'blink_18_analysis_req'
    },
    blink_18_fault: { 
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '18', type: 'end',
      actionKey: 'tml_transil1_fault_action',
      pass: false,
      recommendedParts: [{ brand: 'BIPL', number: '98600140' }, { brand: 'TML', number: '516554600196' }]
    },
    blink_18_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '18', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_19_investigation: {
      phase: 1, titleKey: 'tml_b19_title',
      questionKey: 'tml_transil_q',
      type: 'yes_no', yes: 'blink_19_fault', no: 'blink_19_analysis_req'
    },
    blink_19_fault: { 
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '19', type: 'end',
      actionKey: 'tml_transil2_fault_action',
      pass: false,
      recommendedParts: [{ brand: 'BIPL', number: '98600140' }, { brand: 'TML', number: '516554600196' }]
    },
    blink_19_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '19', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },

    blink_20_investigation: {
      phase: 1, titleKey: 'tml_b20_title',
      questionKey: 'tml_transil_q',
      type: 'yes_no', yes: 'blink_20_fault', no: 'blink_20_analysis_req'
    },
    blink_20_fault: { 
      phase: 1, titleKeyDynamic: 'tml_code_fault_title', N: '20', type: 'end',
      actionKey: 'tml_transil2_fault_action',
      pass: false,
      recommendedParts: [{ brand: 'BIPL', number: '98600140' }, { brand: 'TML', number: '516554600196' }]
    },
    blink_20_analysis_req: { phase: 1, titleKeyDynamic: 'tml_code_analysis_title', N: '20', type: 'end', actionKey: 'tml_blink_analysis_action', pass: false },
  };

  let currentStepId = 'cluster_check';
  let history = []; // { stepId, title, result, detail, pass }
  let timerInterval = null;
  let startedAt = null;
  let blinkCodeTarget = null; // Used during blink code repair flow
  let blinkCodeQueue = [];
  let diagnosticQueue = [];
  let terminalFaults = [];
  let reportSubmitted = false;
  let tmlEvidence = {};
  let tmlFinished = false;
  let tmlDraftDbPromise;

  function openTmlDraftDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (tmlDraftDbPromise) return tmlDraftDbPromise;
    tmlDraftDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('retarder_iq_offline', 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('drafts')) request.result.createObjectStore('drafts', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return tmlDraftDbPromise;
  }

  async function saveTmlDraft() {
    if (tmlFinished) return;
    const db = await openTmlDraftDb();
    if (!db) return;
    const formData = {};
    ['techName', 'techPhone', 'dealerName', 'city', 'state', 'vehReg', 'odometer', 'chassisNo', 'vehModel'].forEach(id => {
      const input = document.getElementById(id);
      if (input) formData[id] = input.value;
    });
    const draft = {
      id: 'tml-active',
      currentStepId,
      history: history.slice(),
      blinkCodeTarget,
      blinkCodeQueue: blinkCodeQueue.slice(),
      diagnosticQueue: diagnosticQueue.slice(),
      terminalFaults: terminalFaults.slice(),
      evidence: { ...tmlEvidence },
      formData,
      elapsedMs: startedAt ? Date.now() - startedAt : 0,
      savedAt: Date.now()
    };
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      const request = transaction.objectStore('drafts').put(draft);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  }

  async function loadTmlDraft() {
    const db = await openTmlDraftDb();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const request = db.transaction('drafts', 'readonly').objectStore('drafts').get('tml-active');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function clearTmlDraft() {
    const db = await openTmlDraftDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const request = db.transaction('drafts', 'readwrite').objectStore('drafts').delete('tml-active');
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  }

  function restoreTmlFormData(formData) {
    Object.entries(formData || {}).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
  }

  function el(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatTime(ms) {
    const mm = String(Math.floor(ms / 60000)).padStart(2, "0");
    const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function startTimer(preserveStartedAt = false) {
    stopTimer();
    if (!preserveStartedAt) startedAt = Date.now();
    timerInterval = setInterval(() => {
      if (!startedAt) return;
      const elapsed = Date.now() - startedAt;
      if (el("tmlElapsed")) el("tmlElapsed").textContent = formatTime(elapsed);
      if (el("tmlElapsedTop")) el("tmlElapsedTop").textContent = formatTime(elapsed);
    }, 500);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function buildCard() {
    if (el("tmlCard")) return;
    const section = document.createElement("section");
    section.className = "card";
    section.id = "tmlCard";
    section.style.display = "none";

    const ribbonHtml = MAIN_PHASES.map((n, i) => {
      const phaseLabel = n.labelKey && typeof t === 'function' ? t(n.labelKey) : (n.label || '');
      const pendingLabel = typeof t === 'function' ? t('tml_pending') : 'Pending';
      return `
      <div class="wf-node-wrap" role="listitem">
        <div class="wf-node pending" id="tml-phase-node-${i}" title="${phaseLabel}">${n.icon}</div>
        <div class="wf-label">${phaseLabel}</div>
        <div class="wf-status pending" id="tml-phase-status-${i}">${pendingLabel}</div>
      </div>
      ${i < MAIN_PHASES.length - 1 ? `<div class="wf-link pending" id="tml-phase-link-${i}" aria-hidden="true"></div>` : ""}
    `;
    }).join("");

    section.innerHTML = `
      <div class="card-h">
        <div class="title" id="tmlGuidedTitle">${typeof t === 'function' ? t('tml_guided_title') : 'Guided Steps — TML Retarder Diagnostics'}</div>
        <span class="tag" id="tmlStepTag">${typeof t === 'function' ? t('tml_phase_label') : 'Phase'} 1</span>
      </div>


      <div class="card-b">

        <div class="test-timing-info" id="tmlDiagnosticHeader" style="display: flex; gap: 20px; align-items: center; padding: 14px; background: linear-gradient(135deg, #f0f9ff, #dbeafe); border-left: 4px solid #0b5daa; border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="timing-item" style="display: flex; flex-direction: column; gap: 4px;">
            <div class="timing-label" style="font-size: 12px; color: #0f172a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">⏱️ Elapsed</div>
            <div class="timing-value" id="tmlElapsedTop" style="font-size: 18px; font-weight: 800; color: #0b5daa;">0:00</div>
          </div>
          <div class="timing-divider" style="width: 1px; height: 40px; background: rgba(11, 93, 170, 0.2);"></div>
          <div class="timing-item" style="display: flex; flex-direction: column; gap: 4px;">
            <div class="timing-label" style="font-size: 12px; color: #0f172a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📊 Progress</div>
            <div class="timing-value" id="tmlProgressPercentTop" style="font-size: 18px; font-weight: 800; color: #0b5daa;">0%</div>
          </div>
          <div class="timing-divider" style="width: 1px; height: 40px; background: rgba(11, 93, 170, 0.2);"></div>
          <div class="timing-item" style="display: flex; flex-direction: column; gap: 4px;">
            <div class="timing-label" style="font-size: 12px; color: #0f172a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🧭 Phase</div>
            <div class="timing-value" id="tmlStepCountTop" style="font-size: 18px; font-weight: 800; color: #0b5daa;">1 / 5</div>
          </div>
        </div>

        <div class="tml-diagnostic-summary" aria-label="TML diagnostic summary">
          <div><span class="tml-summary-label">Vehicle</span><strong id="tmlSummaryVehicle">TML 1822</strong></div>
          <div><span class="tml-summary-label">Complaint</span><strong id="tmlSummaryComplaint">Retarder not working</strong></div>
          <div><span class="tml-summary-label">Current check</span><strong id="tmlSummaryCheck">Cluster Check</strong></div>
        </div>

        <div class="wireflow" aria-label="TML retarder phase sequence">
          <div class="wf-stage" role="list">${ribbonHtml}</div>
        </div>

        <!-- Dynamic Content Area -->
        <section id="tmlDynamicContent" class="step-card-enhanced" style="margin:16px 0;">
          
            <div class="step-counter" style="display:flex; gap:8px; align-items:center;">
              <span id="tmlPhaseCountLabel">${typeof t === 'function' ? t('tml_phase_label') : 'Phase'}</span> <span id="tmlPhaseCountNo">1</span> <span id="tmlOfLabel">${typeof t === 'function' ? t('tml_of') : 'of'}</span> ${MAIN_PHASES.length}
              <span style="color:#64748b; font-weight:normal; border-left:1px solid #cbd5e1; padding-left:8px;" id="tmlElapsed">0:00</span>
            </div>
          </div>
          
          
            <div class="step-header-enhanced">
              <h2 id="tmlNodeTitle"></h2>
              <p class="step-subtitle" id="tmlNodeSubtitle"></p>
              <button type="button" id="tmlShowLocationBtn" class="tml-location-btn" style="display:none;">📍 Show Location</button>
            </div>

            <div id="tmlTestBadges" class="tml-test-badges" aria-label="Test requirements"></div>
            
            <div id="tmlHintContainer" style="display:none; background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:16px 0; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:#b45309;">
                <span style="font-size:18px;">💡</span> <span id="tmlHintTitle">Hint</span>
              </div>
              <div id="tmlHintText" style="color:#92400e; font-size:14px; line-height:1.5;"></div>
            </div>

            <div id="tmlPinBadgesContainer" style="display:none; margin:16px 0; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
              <span style="font-size:12px; font-weight:700; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">📌 PIN SIGNALS</span>
              <div id="tmlPinBadgesWrapper" style="display:flex; gap:8px;"></div>
            </div>
            
            <div id="tmlNodeQAContainer" class="step-qa-enhanced" style="display:none;">
            <div class="question-icon">❓</div>
            <div id="tmlNodeQA" class="step-question-text"></div>
          </div>

          <div id="tmlOptionsContainer" style="margin-top:20px;"></div>

          
          <div id="tmlNodeResult" class="step-result-enhanced" style="display:none;"></div>
          <div class="progress-bar-container" style="background:#e2e8f0; height:12px; border-radius:6px; margin:20px 0; overflow:hidden;">
            <div id="tmlGreenProgressBar" style="background:#10b981; width:0%; height:100%; transition:width 0.4s ease;"></div>
          </div>
        </section>


      </div>
    `;

    document.querySelector("main.wrap").appendChild(section);
    refreshTmlChrome(section);
  }

  function setPhaseState(phaseIndex, state, statusText) {
    if (phaseIndex < 0 || phaseIndex >= MAIN_PHASES.length) return;
    const n = el(`tml-phase-node-${phaseIndex}`);
    const status = el(`tml-phase-status-${phaseIndex}`);
    const link = el(`tml-phase-link-${phaseIndex - 1}`);
    if (n) n.className = `wf-node ${state}`;
    if (status) { status.className = `wf-status ${state}`; status.textContent = statusText; }
    if (link) link.className = `wf-link ${state === "pending" ? "pending" : "pass"}`;
  }

  function updatePhaseUI(phaseIndex) {
    const phaseLabel = typeof t === 'function' ? t('tml_phase_label') : 'Phase';
    const ofLabel = typeof t === 'function' ? t('tml_of') : 'of';
    el("tmlStepTag").textContent = `${phaseLabel} ${phaseIndex + 1}`;
    const phaseCountEl = el("tmlPhaseCountNo");
    if (phaseCountEl) phaseCountEl.textContent = phaseIndex + 1;
    const overallPhasePercent = Math.round(((phaseIndex + 1) / MAIN_PHASES.length) * 100);
    const topStepCount = el("tmlStepCountTop");
    const topProgressPercent = el("tmlProgressPercentTop");
    if (topStepCount) topStepCount.textContent = `${phaseIndex + 1} / ${MAIN_PHASES.length}`;
    if (topProgressPercent) topProgressPercent.textContent = `${overallPhasePercent}%`;
    // Update labels in case language changed
    const phaseLabelEl = el("tmlPhaseCountLabel");
    const ofLabelEl = el("tmlOfLabel");
    if (phaseLabelEl) phaseLabelEl.textContent = phaseLabel;
    if (ofLabelEl) ofLabelEl.textContent = ofLabel;
    const progBar = el("tmlProgressBarEnhanced");
    if (progBar) {
      const pct = Math.round(((phaseIndex + 1) / MAIN_PHASES.length) * 100);
      progBar.style.width = pct + "%";
    }
    
    // Mark previous phases as pass
    for (let i = 0; i < phaseIndex; i++) {
      setPhaseState(i, "pass", typeof t === 'function' ? t('tml_completed') : 'Completed');
    }
    // Mark current as testing
    setPhaseState(phaseIndex, "testing", typeof t === 'function' ? t('tml_in_progress') : 'In Progress...');
    // Mark future as pending
    for (let i = phaseIndex + 1; i < MAIN_PHASES.length; i++) {
      setPhaseState(i, "pending", typeof t === 'function' ? t('tml_pending') : 'Pending');
    }
  }

  function renderStep(stepId) {
    const step = STEPS[stepId];
    if (!step) return;

    if (typeof window.showLocationHelp === 'function') {
      window._hasShownLocFor = window._hasShownLocFor || {};
      const phaseKey = MAIN_PHASES[step.phase].id;
      if (TML_SECTION_INFO[phaseKey] && !window._hasShownLocFor[phaseKey]) {
        window.showLocationHelp(phaseKey, TML_SECTION_INFO[phaseKey]);
        window._hasShownLocFor[phaseKey] = true;
      }
    }


    if (!step) {
      console.error("Step not found: ", stepId);
      return;
    }

    updatePhaseUI(step.phase);

    const phaseKey = MAIN_PHASES[step.phase].id;
    const phaseMeta = TML_PHASE_META[phaseKey] || { tone: 'blue', requirements: [] };
    const dynamicContent = el('tmlDynamicContent');
    if (dynamicContent) dynamicContent.className = `step-card-enhanced tml-phase-card tml-tone-${phaseMeta.tone}`;

    let titleText = step.title || '';
    if (step.titleKeyDynamic && typeof t === 'function') {
      titleText = t(step.titleKeyDynamic).replace('{N}', step.N || '');
    } else if (step.titleKey && typeof t === 'function') {
      titleText = t(step.titleKey);
    }
    const subtitleText = step.subtitleKey && typeof t === 'function' ? t(step.subtitleKey) : (step.subtitle || '');
    let questionText = step.question || null;
    if (step.questionKeyDynamic && typeof t === 'function') {
      questionText = t(step.questionKeyDynamic).replace('{N}', step.N || '');
    } else if (step.questionKey && typeof t === 'function') {
      questionText = t(step.questionKey);
    }

    el("tmlNodeTitle").textContent = titleText;
    el("tmlNodeSubtitle").textContent = subtitleText;

    const rawSummaryVehicle = document.getElementById('vehModel')?.value || '';
    const summaryVehicle = rawSummaryVehicle === 'TML' || !rawSummaryVehicle ? 'TML 1822' : rawSummaryVehicle;
    const summaryComplaint = window._riqComplaintMode === 'Intermittent' ? 'Retarder intermittent' : 'Retarder not working';
    const summaryVehicleEl = el('tmlSummaryVehicle');
    const summaryComplaintEl = el('tmlSummaryComplaint');
    const summaryCheckEl = el('tmlSummaryCheck');
    if (summaryVehicleEl) summaryVehicleEl.textContent = summaryVehicle;
    if (summaryComplaintEl) summaryComplaintEl.textContent = summaryComplaint;
    if (summaryCheckEl) summaryCheckEl.textContent = titleText || MAIN_PHASES[step.phase].label || 'Diagnostic check';

    const locationBtn = el('tmlShowLocationBtn');
    if (locationBtn) {
      const locationInfo = TML_SECTION_INFO[phaseKey];
      locationBtn.style.display = locationInfo ? 'inline-flex' : 'none';
      locationBtn.onclick = locationInfo && typeof window.showLocationHelp === 'function'
        ? () => window.showLocationHelp(phaseKey, { ...locationInfo, title: titleText })
        : null;
    }

    const testBadges = el('tmlTestBadges');
    if (testBadges) {
      testBadges.innerHTML = phaseMeta.requirements.map(([icon, label]) => `<span class="tml-test-badge tml-test-${icon}">${icon === 'ignition' ? '🔑' : icon === 'connector' ? '🔌' : icon === 'meter' ? '📏' : icon === 'engine' ? '🚛' : icon === 'blink' ? '🟣' : '⚠️'} ${label}</span>`).join('');
    }
    
    const qaContainer = el("tmlNodeQAContainer");
    const qaText = el("tmlNodeQA");
    const optionsContainer = el("tmlOptionsContainer");
    const resultBox = el("tmlNodeResult");

    
      resultBox.style.display = "none";
      optionsContainer.innerHTML = "";
      
      const hintContainer = el("tmlHintContainer");
      const hintText = el("tmlHintText");
      if (hintContainer && hintText) {
        if (step.hint) {
          hintText.innerHTML = step.hint;
          hintContainer.style.display = "block";
        } else {
          hintContainer.style.display = "none";
        }
      }

      const badgesContainer = el("tmlPinBadgesContainer");
      const badgesWrapper = el("tmlPinBadgesWrapper");
      if (badgesContainer && badgesWrapper) {
        if (step.pins && step.pins.length > 0) {
          badgesWrapper.innerHTML = step.pins.map(pin => {
            const colorClass = pin.color === 'green' ? 'badge-green' : pin.color === 'red' ? 'badge-red' : pin.color === 'yellow' ? 'badge-yellow' : 'badge-black';
            return '<div class="badge-base ' + colorClass + '"><span class="badge-dot"></span>' + pin.label + '</div>';
          }).join("");
          badgesContainer.style.display = "flex";
        } else {
          badgesContainer.style.display = "none";
        }
      }

      const progressBar = el("tmlGreenProgressBar");
      if (step.progress) {
        const current = step.progress.current;
        const total = step.progress.total;
        const pct = total ? Math.round((current / total) * 100) : 0;
        if (progressBar) progressBar.style.width = pct + "%";
      } else if (progressBar) {
        progressBar.style.width = Math.round(((step.phase + 1) / MAIN_PHASES.length) * 100) + "%";
      }


    if (questionText) {
      qaContainer.style.display = "flex";
      qaText.innerHTML = questionText;
    } else {
      qaContainer.style.display = "none";
    }

    if (step.type === 'yes_no') {
      const yesLabel = typeof t === 'function' ? t('tml_yes_btn') : 'YES — Working';
      const noLabel = typeof t === 'function' ? t('tml_no_btn') : 'NO — Not Working';
      optionsContainer.innerHTML = `
        <div class="step-actions-enhanced">
          <button id="tmlBtnYes" class="step-btn-enhanced step-yes-enhanced">
            <span class="btn-icon">✅</span><span class="btn-text">${yesLabel}</span>
          </button>
          <button id="tmlBtnNo" class="step-btn-enhanced step-no-enhanced">
            <span class="btn-icon">❌</span><span class="btn-text">${noLabel}</span>
          </button>
        </div>
      `;
      el("tmlBtnYes").addEventListener("click", () => handleAnswer(stepId, 'yes'));
      el("tmlBtnNo").addEventListener("click", () => handleAnswer(stepId, 'no'));
    } 
    else if (step.type === 'multi_select_cluster') {
      const diagnoseLabel = typeof t === 'function' ? t('tml_diagnose_btn') : 'Diagnose Selected';
      let buttonsHtml = '<div id="clusterMultiSelect" style="display:flex; flex-direction:column; gap:10px;">';
      step.options.forEach((opt, idx) => {
        const optLabel = opt.labelKey && typeof t === 'function' ? t(opt.labelKey) : (opt.label || '');
        buttonsHtml += `<button class="btn outline cluster-opt-btn" style="justify-content:flex-start; text-align:left; padding:14px;" data-idx="${idx}" data-label="${optLabel}">${optLabel}</button>`;
      });
      buttonsHtml += '</div>';
      buttonsHtml += `
        <div class="step-actions-enhanced" style="margin-top:16px;">
          <button id="tmlBtnClusterContinue" class="step-btn-enhanced step-yes-enhanced" disabled>
            <span class="btn-icon">➡️</span><span class="btn-text">${diagnoseLabel}</span>
          </button>
        </div>
      `;
      optionsContainer.innerHTML = buttonsHtml;

      let selectedIdxs = [];
      const continueBtn = el("tmlBtnClusterContinue");
      
      optionsContainer.querySelectorAll(".cluster-opt-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
          const opt = step.options[idx];
          const noErrorKey = 'tml_opt_no_error';
          const noErrorLabel = typeof t === 'function' ? t(noErrorKey) : 'No Error';
          const currentLabel = e.currentTarget.getAttribute('data-label') || '';
          const isNoError = (opt.labelKey === noErrorKey) || (opt.label === 'No Error') || (currentLabel === noErrorLabel);
          
          if (isNoError) {
            selectedIdxs = [idx];
            optionsContainer.querySelectorAll(".cluster-opt-btn").forEach(b => {
              b.style.background = ""; b.style.color = "";
            });
            e.currentTarget.style.background = "#0B5DAA";
            e.currentTarget.style.color = "#fff";
          } else {
            const noErrorIdx = step.options.findIndex(o => (o.labelKey === noErrorKey) || (o.label === 'No Error'));
            const nePos = selectedIdxs.indexOf(noErrorIdx);
            if (nePos >= 0) {
              selectedIdxs.splice(nePos, 1);
              optionsContainer.querySelectorAll(".cluster-opt-btn")[noErrorIdx].style.background = "";
              optionsContainer.querySelectorAll(".cluster-opt-btn")[noErrorIdx].style.color = "";
            }

            const pos = selectedIdxs.indexOf(idx);
            if (pos >= 0) {
              selectedIdxs.splice(pos, 1);
              e.currentTarget.style.background = "";
              e.currentTarget.style.color = "";
            } else {
              selectedIdxs.push(idx);
              e.currentTarget.style.background = "#0B5DAA";
              e.currentTarget.style.color = "#fff";
            }
          }
            continueBtn.disabled = selectedIdxs.length === 0;
        });
      });

      continueBtn.addEventListener("click", () => {
        const selectedOptions = selectedIdxs.map(i => ({
          ...step.options[i],
          label: step.options[i].labelKey && typeof t === 'function' ? t(step.options[i].labelKey) : (step.options[i].label || ''),
          next: step.options[i].next
        }));
        handleAnswer(stepId, selectedOptions);
      });
    }
    else if (step.type === 'radio') {
      let buttonsHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';
      step.options.forEach((opt, idx) => {
        buttonsHtml += `<button class="btn outline" style="justify-content:flex-start; text-align:left; padding:14px;" data-idx="${idx}">${opt.label}</button>`;
      });
      buttonsHtml += '</div>';
      optionsContainer.innerHTML = buttonsHtml;

      optionsContainer.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = e.currentTarget.getAttribute("data-idx");
          handleAnswer(stepId, step.options[idx]);
        });
      });
    }
    else if (step.type === 'multi_select') {
      let gridHtml = '<div id="tmlCodeGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(64px,1fr)); gap:10px; margin:16px 0;">';
      for (let i = 1; i <= 20; i++) {
        gridHtml += `<button class="btn outline blink-opt-btn" data-code="${i}" style="padding:10px 0;">${i}</button>`;
      }
      gridHtml += '</div>';
      gridHtml += `
        <div class="step-actions-enhanced">
          <button id="tmlBtnContinue" class="step-btn-enhanced step-yes-enhanced" disabled>
            <span class="btn-icon">➡️</span><span class="btn-text">${typeof t === 'function' ? t('tml_diagnose_btn') : 'Diagnose Selected'}</span>
          </button>
        </div>
      `;
      optionsContainer.innerHTML = gridHtml;
      
      let selectedCodes = [];
      const continueBtn = el("tmlBtnContinue");
      
      optionsContainer.querySelectorAll(".blink-opt-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const c = parseInt(e.currentTarget.getAttribute("data-code"), 10);
          const i = selectedCodes.indexOf(c);
          if (i >= 0) {
            selectedCodes.splice(i, 1);
            e.currentTarget.style.background = "";
            e.currentTarget.style.color = "";
          } else {
            selectedCodes.push(c);
            e.currentTarget.style.background = "#0B5DAA";
            e.currentTarget.style.color = "#fff";
          }
          continueBtn.disabled = selectedCodes.length === 0;
        });
      });

      continueBtn.addEventListener("click", () => {
        handleAnswer(stepId, selectedCodes);
      });
    }
    else if (step.type === 'end') {
      terminalFaults.push(stepId);
      let actionText = step.action || '';
      if (step.actionKeyDynamic && typeof t === 'function') {
        actionText = t(step.actionKeyDynamic).replace('{N}', step.N || '');
      } else if (step.actionKey && typeof t === 'function') {
        actionText = t(step.actionKey);
      }
      showResult(step.pass ? 'step-pass' : 'step-fail', actionText, true, stepId);
    }

  }

  function showResult(badgeClass, text, isFinal = false, evidenceStepId = currentStepId) {
    const box = el("tmlNodeResult");
    box.className = `step-result-enhanced ${badgeClass}`;
    box.style.display = "block";
    
    if (isFinal && badgeClass === 'step-pass' && (blinkCodeQueue.length > 0 || diagnosticQueue.length > 0)) {
      if (blinkCodeQueue.length > 0) {
        blinkCodeTarget = blinkCodeQueue.shift();
        currentStepId = `blink_${blinkCodeTarget}_investigation`;
      } else {
        currentStepId = diagnosticQueue.shift();
      }
      renderStep(currentStepId);
      return;
    } else if (isFinal) {
      const genLabel = typeof t === 'function' ? t('tml_generating') : 'Generating report...';
      if (badgeClass === 'step-fail') {
        const hasNextFailure = blinkCodeQueue.length > 0 || diagnosticQueue.length > 0;
        const nextLabel = hasNextFailure ? t('tml_continue_failed') : t('tml_generate_report');
        box.innerHTML = `<div>${text}</div><label class="step-evidence-label">Add photo evidence (optional)<input id="tmlEvidenceInput" class="step-evidence-input" type="file" accept="image/*" capture="environment"><span id="tmlEvidenceStatus"></span><img id="tmlEvidencePreview" class="step-evidence-preview" alt="Attached evidence preview" style="display:none; width:120px; height:90px; object-fit:cover; margin-top:8px; border-radius:8px; border:1px solid #cbd5e1;"></label><button class="btn" id="tmlFinishReport" style="margin-top:15px; width:100%;">${nextLabel}</button>`;
        el('tmlEvidenceInput').addEventListener('change', async event => {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          const evidence = await compressTmlImage(file);
          tmlEvidence[evidenceStepId] = evidence;
          await saveTmlDraft();
          el('tmlEvidenceStatus').textContent = ' Photo attached — tap to replace';
          const preview = el('tmlEvidencePreview');
          preview.src = evidence.dataUrl;
          preview.style.display = 'block';
        });
        el('tmlFinishReport').addEventListener('click', () => {
          if (!hasNextFailure) {
            finishAll();
            return;
          }
          if (blinkCodeQueue.length > 0) {
            blinkCodeTarget = blinkCodeQueue.shift();
            currentStepId = `blink_${blinkCodeTarget}_investigation`;
          } else {
            currentStepId = diagnosticQueue.shift();
          }
          renderStep(currentStepId);
        });
      } else {
        box.innerHTML = `<div>${text}</div><div style="margin-top:15px; text-align:center; color:#64748b; font-size:14px; font-weight:600;">${genLabel}</div>`;
        setTimeout(finishAll, 1500);
      }
    } else {
      const continueLabel = typeof t === 'function' ? t('tml_continue_btn') : 'Continue';
      const evidenceMarkup = badgeClass === 'step-fail'
        ? `<label class="step-evidence-label">Add photo evidence (optional)<input id="tmlStepEvidenceInput" class="step-evidence-input" type="file" accept="image/*" capture="environment"><span id="tmlStepEvidenceStatus"></span><img id="tmlStepEvidencePreview" class="step-evidence-preview" alt="Attached evidence preview" style="display:none; width:120px; height:90px; object-fit:cover; margin-top:8px; border-radius:8px; border:1px solid #cbd5e1;"></label>`
        : '';
      box.innerHTML = `<div>${text}</div>${evidenceMarkup}<button class="btn" style="margin-top:15px; width:100%;" id="tmlBtnResultContinue">${continueLabel}</button>`;
      if (badgeClass === 'step-fail') {
        el('tmlStepEvidenceInput').addEventListener('change', async event => {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          const evidence = await compressTmlImage(file);
          tmlEvidence[evidenceStepId] = evidence;
          await saveTmlDraft();
          el('tmlStepEvidenceStatus').textContent = ' Photo attached — tap to replace';
          const preview = el('tmlStepEvidencePreview');
          preview.src = evidence.dataUrl;
          preview.style.display = 'block';
        });
      }
      el("tmlBtnResultContinue").addEventListener("click", () => {
        renderStep(currentStepId); // currentStepId will have been updated by handleAnswer
      });
    }

    const acts = el("tmlOptionsContainer").querySelector(".step-actions-enhanced");
    if (acts) acts.style.display = "none";
    
    const allBtns = el("tmlOptionsContainer").querySelectorAll("button");
    allBtns.forEach(btn => btn.disabled = true);
  }

  function handleAnswer(stepId, answer) {
    const step = STEPS[stepId];
    setTimeout(() => saveTmlDraft().catch(error => console.error('[TML Draft] Save failed:', error)), 0);
    
    if (step.type === 'multi_select_cluster') {
      const selectedOpts = answer;
      const labels = selectedOpts.map(o => o.label);
      history.push({ 
        stepId, 
        title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), 
        question: step.questionKeyDynamic ? t(step.questionKeyDynamic).replace('{N}', step.N) : (step.questionKey ? t(step.questionKey) : (step.question || '')),
        result: labels.join(', '), 
        detail: `Selected ${labels.join(', ')}`, 
        pass: labels.includes('No Error')
      });
      diagnosticQueue = selectedOpts.map(o => o.next);
      currentStepId = diagnosticQueue.shift();
      renderStep(currentStepId);
    }
    else if (step.type === 'yes_no') {
      const isYes = (answer === 'yes');
      const nextStep = isYes ? step.yes : step.no;
      history.push({ 
        stepId, 
        title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), 
        question: step.questionKeyDynamic ? t(step.questionKeyDynamic).replace('{N}', step.N) : (step.questionKey ? t(step.questionKey) : (step.question || '')),
        result: isYes ? 'YES' : 'NO', 
        detail: `Selected ${isYes ? 'YES' : 'NO'}`, 
        pass: isYes 
      });
      currentStepId = nextStep;
      renderStep(currentStepId);
    } 
    else if (step.type === 'radio') {
      history.push({ 
        stepId, 
        title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), 
        question: step.questionKeyDynamic ? t(step.questionKeyDynamic).replace('{N}', step.N) : (step.questionKey ? t(step.questionKey) : (step.question || '')),
        result: answer.label, 
        detail: `Selected ${answer.label}`, 
        pass: true 
      });
      currentStepId = answer.next;
      renderStep(currentStepId);
    }
    else if (step.type === 'multi_select') {
      const codes = answer; // array of numbers
      history.push({ 
        stepId, 
        title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), 
        question: step.questionKeyDynamic ? t(step.questionKeyDynamic).replace('{N}', step.N) : (step.questionKey ? t(step.questionKey) : (step.question || '')),
        result: `Codes: ${codes.join(', ')}`, 
        detail: `Selected codes: ${codes.join(', ')}`, 
        pass: false 
      });

      if (codes.length > 0) {
        let uniqueCodes = [...codes];
        
        if (uniqueCodes.includes(17) && uniqueCodes.includes(18)) {
          uniqueCodes = uniqueCodes.filter(c => c !== 18);
          STEPS['blink_17_investigation'].titleKey = 'tml_b17_b18_title';
          STEPS['blink_17_fault'].titleKey = 'tml_b17_b18_fault_title';
        } else {
          if (STEPS['blink_17_investigation']) {
            STEPS['blink_17_investigation'].titleKey = 'tml_b17_title';
            STEPS['blink_17_fault'].titleKey = 'tml_b17_fault_title';
          }
          if (STEPS['blink_18_investigation']) {
            STEPS['blink_18_investigation'].titleKey = 'tml_b18_title';
            STEPS['blink_18_fault'].titleKey = 'tml_b18_fault_title';
          }
        }

        if (uniqueCodes.includes(19) && uniqueCodes.includes(20)) {
          uniqueCodes = uniqueCodes.filter(c => c !== 20);
          STEPS['blink_19_investigation'].titleKey = 'tml_b19_b20_title';
          STEPS['blink_19_fault'].titleKey = 'tml_b19_b20_fault_title';
        } else {
          if (STEPS['blink_19_investigation']) {
            STEPS['blink_19_investigation'].titleKey = 'tml_b19_title';
            STEPS['blink_19_fault'].titleKey = 'tml_b19_fault_title';
          }
          if (STEPS['blink_20_investigation']) {
            STEPS['blink_20_investigation'].titleKey = 'tml_b20_title';
            STEPS['blink_20_fault'].titleKey = 'tml_b20_fault_title';
          }
        }

        let sortedCodes = [...uniqueCodes].sort((a, b) => {
          let pA = BLINK_CODES[a] ? BLINK_CODES[a].priority : 999;
          let pB = BLINK_CODES[b] ? BLINK_CODES[b].priority : 999;
          return pA - pB;
        });
        blinkCodeQueue = sortedCodes;
        blinkCodeTarget = blinkCodeQueue.shift();
        currentStepId = `blink_${blinkCodeTarget}_investigation`;
        renderStep(currentStepId);
      } else {
        if (diagnosticQueue.length > 0) {
          currentStepId = diagnosticQueue.shift();
          renderStep(currentStepId);
        } else {
          finishAll();
        }
      }
    }
    else if (step.type === 'end') {
      history.push({ 
        stepId, 
        title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), 
        question: step.questionKeyDynamic ? t(step.questionKeyDynamic).replace('{N}', step.N) : (step.questionKey ? t(step.questionKey) : (step.question || '')),
        result: step.pass ? 'PASS' : 'FAIL', 
        detail: step.actionKeyDynamic ? t(step.actionKeyDynamic).replace('{N}', step.N) : (step.actionKey ? t(step.actionKey) : (step.action || '')), 
        pass: step.pass 
      });
      finishAll();
    }
  }

  function finishAll() {
    stopTimer();
    tmlFinished = true;
    // Update all phase UI to complete based on last state
    const currentPhase = STEPS[currentStepId] ? STEPS[currentStepId].phase : MAIN_PHASES.length - 1;
    for (let i = 0; i <= currentPhase; i++) {
      setPhaseState(i, "pass", "Completed");
    }
    generateTmlReport();
  }

  function generateTmlReport() {
    const resultSummary = document.getElementById("resultSummary");
    if (!resultSummary) return;
    clearTmlDraft().catch(error => console.error('[TML Draft] Clear failed:', error));

    let isSuccess = true;
    if (terminalFaults.length > 0) {
      isSuccess = terminalFaults.every(id => STEPS[id].pass);
    } else if (history.length > 0) {
      isSuccess = history[history.length - 1].pass === true;
    }

    const identifiedSteps = history.filter(h => h.result === 'Identified');

    const techName   = esc(document.getElementById("techName")?.value   || "-");
    const techPhone  = esc(document.getElementById("techPhone")?.value  || "-");
    const dealerName = esc(document.getElementById("dealerName")?.value || "-");
    const city       = esc(document.getElementById("city")?.value       || "-");
    const state      = esc(document.getElementById("state")?.value      || "-");
    const vehReg     = esc(document.getElementById("vehReg")?.value     || "-");
    const odometer   = esc(document.getElementById("odometer")?.value   || "-");
    const chassisNo  = esc(document.getElementById("chassisNo")?.value  || "-");
    const vehModel   = esc(document.getElementById("vehModel")?.value   || "TML");

    const elapsedTimeText = el("tmlElapsed")?.textContent || "0:00";
    const date = new Date().toLocaleString();

    let outcomeText = typeof t === 'function' ? t('tml_pass_result') : 'NO FAULT FOUND';
    let outcomeBgColor = "#dcfce7";
    let outcomeTextColor = "#16a34a";
    let detailLabel = typeof t === 'function' ? t('tml_fault_details') : 'FAULT DETAILS';

    if (isSuccess) {
      outcomeText = typeof t === 'function' ? t('tml_pass_result') : 'RETARDER WORKING IN GOOD CONDITION';
      outcomeBgColor = "#dcfce7";
      outcomeTextColor = "#16a34a";
    } else {
      outcomeText = typeof t === 'function' ? t('tml_fail_result') : 'FAULT FOUND';
      outcomeBgColor = "#fee2e2";
      outcomeTextColor = "#dc2626";
    }

    let faultItems = [];
    const failedFaults = terminalFaults.filter(id => !STEPS[id].pass);
    
    if (failedFaults.length > 0) {
      failedFaults.forEach(id => {
        const step = STEPS[id];
        let brand = ''; let partNo = '';
        if (step.recommendedParts && step.recommendedParts.length > 0) {
          brand = step.recommendedParts[0].brand;
          partNo = step.recommendedParts[0].number;
        }
        faultItems.push({ title: step.titleKeyDynamic ? t(step.titleKeyDynamic).replace('{N}', step.N) : (step.titleKey ? t(step.titleKey) : (step.title || '')), action: step.actionKeyDynamic ? t(step.actionKeyDynamic).replace('{N}', step.N) : (step.actionKey ? t(step.actionKey) : (step.action || '')), brand, partNo, type: 'failed' });
      });
    }
    
    identifiedSteps.forEach(h => {
      let brand = ''; let partNo = '';
      const match = h.detail.match(/([a-zA-Z]+):\s*([\w\-]+)/);
      if (match) { brand = match[1].toUpperCase(); partNo = match[2]; }
      faultItems.push({ title: h.title, action: h.detail, brand, partNo, type: 'failed' });
    });


    let faultDetailsHtml = '';
    if (faultItems.length > 0) {
      let combinedFaults = faultItems.map((item, index) => {
        let sparePartsHtml = '';
        if (item.brand && item.partNo) {
          const recPartLabel = typeof t === 'function' ? t('tml_rec_part') : 'RECOMMENDED SPARE PART';
          sparePartsHtml = `
          <div style="background:#fff7ed; border:1px solid #fb923c; border-radius:10px; display:flex; align-items:center; gap:12px; padding:10px; font-family:'Outfit', sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
            <div style="background:#ffedd5; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid #fed7aa;">📦</div>
            <div style="flex:1;">
                <div style="font-size:9px; color:#c2410c; text-transform:uppercase; font-weight:800; letter-spacing:0.8px; margin-bottom:2px;">${recPartLabel}</div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:14px; font-weight:800; color:#431407;">${item.brand}</span>
                    <span style="background:#7c2d12; color:#ffffff; padding:2px 10px; border-radius:5px; font-family:'Outfit'; font-size:16px; font-weight:800; border:1px solid #431407; display:inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                        ${item.partNo}
                    </span>
                </div>
            </div>
          </div>`;
        }

        let borderColor = '#ef4444'; // Default red
        let textColor = '#b91c1c';
        
        if (item.type === 'unresolved') {
          borderColor = '#f59e0b';
          textColor = '#b45309';
        } else if (item.type === 'repaired') {
          borderColor = '#22c55e'; // Green for repaired
          textColor = '#15803d';
        }

        const titleText = item.title ? `<span style="display:block; margin-bottom:4px; font-weight:700;">${item.title}</span>` : '';

        return `
          <div style="margin-bottom: ${index < faultItems.length - 1 ? '20px' : '0'}; padding-bottom: ${index < faultItems.length - 1 ? '20px' : '0'}; border-bottom: ${index < faultItems.length - 1 ? '1px dashed #cbd5e1' : 'none'};">
            <div style="color:${textColor}; font-size:14px; border-left:4px solid ${borderColor}; padding-left:12px; line-height:1.5; margin-bottom:15px;">
              ${titleText}${item.action}
            </div>
            ${sparePartsHtml}
          </div>
        `;
      }).join('');

      faultDetailsHtml = `
        <div>
          <h4 style="margin:0 0 12px; color:#64748b; font-size:12px; text-transform:uppercase;">${detailLabel}</h4>
          ${combinedFaults}
        </div>
      `;
      if (window.RIQReportRenderer) {
        faultDetailsHtml = `<div><h4 style="margin:0 0 12px; color:#64748b; font-size:12px; text-transform:uppercase;">${detailLabel}</h4>${window.RIQReportRenderer.renderFaultDetails({ 'Diagnostic Fault Details': faultItems })}</div>`;
      }
    }

    const stepRows = history.map((h, i) => {
      let responseText = h.result;
      if (responseText === 'YES') responseText = typeof t === 'function' ? t('yes') : 'Yes';
      if (responseText === 'NO') responseText = typeof t === 'function' ? t('no') : 'No';
      const savedStep = STEPS[h.stepId] || {};
      let translatedQuestion = h.question || '';
      if (savedStep.questionKeyDynamic && typeof t === 'function') translatedQuestion = t(savedStep.questionKeyDynamic).replace('{N}', savedStep.N || '');
      else if (savedStep.questionKey && typeof t === 'function') translatedQuestion = t(savedStep.questionKey);
      const qText = translatedQuestion ? esc(translatedQuestion.replace(/<br>/gi, ' ').replace(/<[^>]*>?/gm, '')) : esc(h.title);

      return `
      <tr>
        <td style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:center; color:#475569; width:50px; white-space:nowrap;">${String(i + 1).padStart(2, "0")}</td>
        <td style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:left; color:#475569;">${qText}</td>
        <td style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:left; font-weight:700; color:#0f172a;">${esc(responseText)}</td>
      </tr>
      `;
    }).join("");

    resultSummary.innerHTML = `
      <div style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:24px; font-family:'Outfit', sans-serif;">
        <div class="report-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
          <div>
            <h4 style="margin:0 0 12px; color:#0B5DAA; font-size:14px; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #dbeafe; padding-bottom:4px;">${typeof t === 'function' ? t('tml_technician_details') : 'Technician Details'}</h4>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_name') : 'Name'}:</strong> ${techName}</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_phone') : 'Phone'}:</strong> ${techPhone}</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_workshop') : 'Workshop'}:</strong> ${dealerName}</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('location') : 'Location'}:</strong> ${city}, ${state}</p>
          </div>
          <div>
            <h4 style="margin:0 0 12px; color:#0B5DAA; font-size:14px; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #dbeafe; padding-bottom:4px;">${typeof t === 'function' ? t('tml_vehicle_details') : 'Vehicle Details'}</h4>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_reg_no') : 'Reg No'}:</strong> ${vehReg}</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_model') : 'Model'}:</strong> ${vehModel}</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_odometer') : 'Odometer'}:</strong> ${odometer} km</p>
            <p style="margin:4px 0; font-size:15px;"><strong>${typeof t === 'function' ? t('rep_chassis') : 'Chassis'}:</strong> ${chassisNo}</p>
          </div>
        </div>

        <div style="margin-top:24px; background:#fff; border:1px solid #dbeafe; border-radius:10px; padding:16px;">
          <div class="report-grid" style="display:grid; grid-template-columns: ${faultDetailsHtml ? '1fr 1fr' : '1fr'}; gap:24px;">
            <div>
              <h4 style="margin:0 0 12px; color:#64748b; font-size:12px; text-transform:uppercase;">${typeof t === 'function' ? t('tml_diagnostic_summary') : 'Diagnostic Summary'}</h4>
              <p style="margin:4px 0; font-size:16px;"><strong>${typeof t === 'function' ? t('tml_outcome') : 'Outcome'}:</strong> <span style="background:${outcomeBgColor}; color:${outcomeTextColor}; padding:2px 8px; border-radius:4px; font-weight:800;">${outcomeText}</span></p>
              <p style="margin:4px 0; font-size:14px; color:#64748b;"><strong>${typeof t === 'function' ? t('tml_duration') : 'Duration'}:</strong> ${elapsedTimeText}</p>
              <p style="margin:4px 0; font-size:14px; color:#64748b;"><strong>${typeof t === 'function' ? t('tml_date') : 'Date'}:</strong> ${date}</p>
            </div>
            ${faultDetailsHtml}
          </div>
        </div>
      </div>

      <h4 style="margin:0 0 12px; color:#0f172a; font-weight:700;">${typeof t === 'function' ? t('tml_step_history') : 'Step History'}</h4>
      <div class="table-wrapper" style="overflow:hidden; border:1px solid #e2e8f0; border-radius:10px;">
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:center; color:#475569; width:50px; white-space:nowrap;">#</th>
              <th style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:left; color:#475569;">${typeof t === 'function' ? t('tml_diag_question') : 'Diagnostic Question'}</th>
              <th style="padding:12px; border-bottom:2px solid #e2e8f0; text-align:left; color:#475569;">${typeof t === 'function' ? t('tml_response') : 'Response'}</th>
            </tr>
          </thead>
          <tbody>${stepRows}</tbody>
        </table>
      </div>
    `;

    submitTmlDiagnostic({
      isSuccess,
      outcomeText,
      faultItems,
      elapsedTimeText,
      date
    });

    if (typeof window.showSection === "function") window.showSection("resultCard");
  }

  function compressTmlImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Unable to read image'));
        image.onload = () => {
          const maxSize = 1280;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({ name: file.name, type: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', 0.68) });
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function submitTmlDiagnostic(report) {
    if (reportSubmitted || typeof window.sendDataToGoogleSheet !== 'function') return;
    reportSubmitted = true;

    const rawValue = id => document.getElementById(id)?.value || '-';
    const historyRows = history.map(step => ({
      key: step.stepId,
      question: String(step.question || step.title || '').replace(/<br>/gi, ' ').replace(/<[^>]*>/g, ''),
      response: step.result === 'YES' ? 'Yes' : step.result === 'NO' ? 'No' : step.result || '-'
    }));
    const firstPart = report.faultItems.find(item => item.partNo);
    const faultText = report.faultItems.map(item => item.action || item.title).filter(Boolean).join(' ');
    const payload = {
      'Diagnostic Case ID': `TML-${Date.now()}`,
      'Diagnostic Data Version': 'TML-1.0.0',
      'Sl. No.': window._slNo++,
      'Business Unit': 'HVBU',
      'Segment': 'HCV',
      'Customer': 'TATA MOTORS',
      'Vehicle Manufacturer': 'TATA MOTORS',
      'Model': rawValue('vehModel') || 'TML 1822',
      'Vehicle Registration No.': rawValue('vehReg'),
      'Emission Standard': 'TML',
      'Complaint Type': 'Not Working',
      'Type of brake': 'Air',
      'Type of arrangement': '-',
      'Product': 'EMR',
      'Region': 'Other',
      'Dealer / Location': rawValue('dealerName'),
      'Complaint Attended on': new Date().toLocaleDateString(),
      'FSE Name': rawValue('techName'),
      'Technician Phone': rawValue('techPhone'),
      'City': rawValue('city'),
      'State': rawValue('state'),
      'Diagnostic Duration': report.elapsedTimeText,
      'Diagnostic Status': report.isSuccess ? 'WORKING SATISFACTORY' : 'FAULT FOUND',
      'Chassis No.': rawValue('chassisNo'),
      'Kms & Date of Sale': rawValue('odometer'),
      'Customer Voice / Field Complaints reported': faultText || report.outcomeText,
      'Diagnostic Fault Details': report.faultItems.map(item => ({
        title: item.title || '',
        action: item.action || '',
        brand: item.brand || '',
        partNo: item.partNo || ''
      })),
      'Technical Service comments': report.outcomeText,
      'Suspected Product': firstPart?.title || 'TML ECS / Retarder',
      'Recommended Part No.': firstPart?.partNo || '-',
      'Vehicle under warranty period?': '-',
      'Repeat complaint? Yes / No': 'No',
      'Liability BI / Not off BI': 'Non BI',
      'Action (if any)': 'For information',
      'QA Comments': '-',
      'Diagnostic Step History': historyRows,
      'Step Evidence': tmlEvidence
    };

    Promise.resolve(window.sendDataToGoogleSheet(payload)).catch(error => {
      reportSubmitted = false;
      console.error('[TML] Diagnostic submission failed:', error);
    });
  }

  window.TML_DIAGNOSTIC_DATA = {
    version: '1.0.0',
    phases: MAIN_PHASES,
    steps: STEPS,
    blinkCodes: BLINK_CODES
  };

  // The bundled rules keep offline startup instant; a versioned catalog can
  // replace them asynchronously without blocking the technician UI.
  if (typeof fetch === 'function' && window.location?.protocol !== 'file:') {
    fetch('/data/tmlDiagnostic.v1.0.0.json', { cache: 'no-cache' })
      .then(response => response.ok ? response.json() : null)
      .then(catalog => {
        if (!catalog) return;
        Object.keys(STEPS).forEach(key => delete STEPS[key]);
        Object.assign(STEPS, catalog.steps || {});
        Object.keys(BLINK_CODES).forEach(key => delete BLINK_CODES[key]);
        Object.assign(BLINK_CODES, catalog.blinkCodes || {});
        window.TML_DIAGNOSTIC_DATA = { ...catalog, phases: catalog.phases || MAIN_PHASES, steps: STEPS, blinkCodes: BLINK_CODES };
      })
      .catch(error => console.warn('[TML data] Using bundled catalog.', error));
  }

  // Entry point: called from index.html
  function refreshTmlChrome(section = el("tmlCard")) {
    if (!section || typeof t !== 'function') return;
    updatePhaseUI(STEPS[currentStepId]?.phase || 0);
    const timingLabels = section.querySelectorAll('.timing-label');
    if (timingLabels[0]) timingLabels[0].textContent = `⏱️ ${t('tml_elapsed_label')}`;
    if (timingLabels[1]) timingLabels[1].textContent = `📊 ${t('tml_progress_label')}`;
    if (timingLabels[2]) timingLabels[2].textContent = `🧭 ${t('tml_step_label')}`;
    const hintTitle = section.querySelector('#tmlHintTitle');
    if (hintTitle) hintTitle.textContent = t('tml_hint_label');
    const pinLabel = section.querySelector('#tmlPinBadgesContainer > span');
    if (pinLabel) pinLabel.textContent = `📌 ${t('tml_pin_signals_label')}`;
    section.querySelectorAll('.step-evidence-label').forEach(label => {
      if (label.firstChild) label.firstChild.textContent = t('tml_photo_evidence');
    });
  }

  window.startTmlDiagnosis = async function () {
    const draft = await loadTmlDraft().catch(() => null);
    if (draft && window.confirm('Resume your unfinished TML diagnostic?')) {
      currentStepId = draft.currentStepId || 'cluster_check';
      history = draft.history || [];
      blinkCodeTarget = draft.blinkCodeTarget || null;
      blinkCodeQueue = draft.blinkCodeQueue || [];
      diagnosticQueue = draft.diagnosticQueue || [];
      terminalFaults = draft.terminalFaults || [];
      tmlEvidence = draft.evidence || {};
      restoreTmlFormData(draft.formData);
      reportSubmitted = false;
      tmlFinished = false;
      startedAt = Date.now() - (draft.elapsedMs || 0);
      buildCard();
      renderStep(currentStepId);
      startTimer(true);
      saveTmlDraft().catch(error => console.error('[TML Draft] Save failed:', error));
      if (typeof window.showSection === "function") window.showSection("tmlCard");
      return;
    }
    if (draft) await clearTmlDraft().catch(() => {});
    currentStepId = 'cluster_check';
    history = [];
    blinkCodeTarget = null;
    blinkCodeQueue = [];
    diagnosticQueue = [];
    terminalFaults = [];
    reportSubmitted = false;
    tmlEvidence = {};
    tmlFinished = false;
    buildCard();
    renderStep(currentStepId);
    startTimer();
    saveTmlDraft().catch(error => console.error('[TML Draft] Save failed:', error));
    if (typeof window.showSection === "function") window.showSection("tmlCard");
  };

  // Re-render the active TML question when the technician changes language.
  window.refreshTmlStep = function () {
    if (currentStepId && el("tmlCard")) {
      renderStep(currentStepId);
      refreshTmlChrome();
    }
  };

})();
