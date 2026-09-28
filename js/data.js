// LiftLog built-in exercise database.
// Each line: Name;Family;Variation;primary[:emphasis];secondary muscles;equipment code;pattern;flags
// flags: u = unilateral, t = timed (seconds logged in the reps column)

export const EXERCISE_DB_VERSION = '2026.09.27';

export const MUSCLES = {
  chest: 'Chest', lats: 'Lats', upperBack: 'Upper back', lowerBack: 'Lower back', traps: 'Traps',
  frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  quads: 'Quadriceps', hamstrings: 'Hamstrings', glutes: 'Glutes', adductors: 'Adductors', abductors: 'Abductors',
  calves: 'Calves', tibialis: 'Tibialis', abs: 'Abs', obliques: 'Obliques', core: 'Core', fullBody: 'Full body', other: 'Other',
};


export const EQUIP = {
  BB: 'Barbell', DB: 'Dumbbell', CB: 'Cable', SM: 'Selectorized machine', PL: 'Plate-loaded machine',
  SX: 'Smith machine', EZ: 'EZ bar', TB: 'Trap bar', LM: 'Landmine', BW: 'Bodyweight',
  WB: 'Weighted bodyweight', RB: 'Resistance band', OT: 'Other',
};
export const EQUIPMENT = Object.values(EQUIP);

export const FILTER_GROUPS = [
  ['all', 'All', null],
  ['chest', 'Chest', ['chest']],
  ['back', 'Back', ['lats', 'upperBack', 'lowerBack', 'traps']],
  ['shoulders', 'Shoulders', ['frontDelts', 'sideDelts', 'rearDelts']],
  ['biceps', 'Biceps', ['biceps']],
  ['triceps', 'Triceps', ['triceps']],
  ['legs', 'Legs', ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'tibialis']],
  ['core', 'Abs/Core', ['abs', 'obliques', 'core']],
  ['forearms', 'Forearms', ['forearms']],
  ['traps', 'Traps', ['traps']],
  ['lats', 'Lats', ['lats']],
  ['quads', 'Quads', ['quads']],
  ['hamstrings', 'Hamstrings', ['hamstrings']],
  ['glutes', 'Glutes', ['glutes']],
  ['calves', 'Calves', ['calves', 'tibialis']],
  ['hips', 'Adductors/Abductors', ['adductors', 'abductors']],
  ['full', 'Full body', ['fullBody']],
  ['other', 'Other', ['other']],
];

const P = (label, steps, tips) => ({ label, steps, tips });
export const PATTERNS = {
  hpress: P('Horizontal press', ['Set up with your feet planted and shoulder blades pulled back and down.', 'Start with the weight over your chest, arms extended.', 'Lower under control until your hands reach chest level.', 'Press back up along the same path without bouncing.'], ['Keep your wrists stacked over your elbows.', 'End the set a rep before your form breaks down.']),
  fly: P('Chest fly', ['Start with your arms extended in front of your chest, elbows slightly bent.', 'Open your arms in a wide arc until you feel a stretch across your chest.', 'Bring the handles back together by squeezing your chest.', 'Keep the elbow angle fixed throughout.'], ['Think “hug a barrel” rather than pressing.', 'Use a load you can control through the full stretch.']),
  pushup: P('Push-up', ['Place your hands slightly wider than your shoulders, body in a straight line.', 'Lower your chest toward the floor with elbows about 45° from your body.', 'Push back up until your arms are straight.'], ['Brace your abs and glutes so your hips don’t sag.', 'Log added load in the weight column; leave 0 for bodyweight.']),
  dip: P('Dip', ['Support yourself on straight arms.', 'Lower by bending your elbows until your shoulders are just below your elbows.', 'Press back up to straight arms.'], ['Lean forward for more chest, stay upright for more triceps.', 'Log added load in the weight column; leave 0 for bodyweight.']),
  hinge: P('Hip hinge', ['Stand with the weight close to your body, feet about hip-width apart.', 'Push your hips back while keeping a neutral spine.', 'Lower until you feel a strong hamstring stretch or the weight reaches the floor.', 'Drive your hips forward to stand tall.'], ['Keep the weight close to your legs the whole way.', 'Brace your core before every rep.']),
  row: P('Row', ['Set up with a neutral spine and your arms extended.', 'Pull the weight toward your lower ribs, leading with your elbows.', 'Squeeze your shoulder blades together at the top.', 'Lower under control to a full stretch.'], ['Avoid jerking the weight with your lower back.', 'Pause briefly at the top for better control.']),
  pulldown: P('Vertical pull', ['Sit with your thighs secured and grip the handle.', 'Pull the handle toward your upper chest, driving your elbows down.', 'Return slowly until your arms are fully extended.'], ['Keep your chest up and avoid leaning far back.', 'Think about pulling with your elbows, not your hands.']),
  pullup: P('Vertical pull', ['Hang from the bar with your arms straight.', 'Pull until your chin clears the bar.', 'Lower under control to a full hang.'], ['Avoid kipping or swinging.', 'Log added load in the weight column; leave 0 for bodyweight.']),
  pullover: P('Pullover', ['Start with your arms extended overhead or in front, elbows slightly bent.', 'Sweep your arms down toward your hips using your lats.', 'Return slowly to the stretched position.'], ['Keep the elbow angle fixed.', 'Feel the stretch in your lats at the top.']),
  vpress: P('Vertical press', ['Start with the weight at shoulder height, core braced.', 'Press straight overhead until your arms are extended.', 'Lower under control back to shoulder height.'], ['Keep your ribs down; avoid arching your lower back.', 'Move your head out of the bar path as needed.']),
  lateral: P('Lateral raise', ['Start with the weight at your side, elbow slightly bent.', 'Raise your arm out to the side until it reaches shoulder height.', 'Lower slowly.'], ['Lead with your elbow, not your hand.', 'Light weight and strict form work best here.']),
  frontraise: P('Front raise', ['Hold the weight in front of your thighs.', 'Raise it forward to shoulder height with your arms nearly straight.', 'Lower under control.'], ['Avoid swinging your torso.', 'Stop at shoulder height.']),
  reardelt: P('Rear-delt fly', ['Set up with your chest supported or your torso hinged forward.', 'Move your arms out and back in a wide arc.', 'Pause at the top, then lower slowly.'], ['Don’t pinch your shoulder blades hard; let the rear delts do the work.', 'Use light weight and strict form.']),
  facepull: P('Face pull', ['Set the cable at upper-chest to face height with a rope.', 'Pull the rope toward your face, separating your hands.', 'Finish with your elbows high and hands beside your ears, then return slowly.'], ['Think about pulling the rope apart.', 'Keep your torso still.']),
  upright: P('Upright row', ['Hold the bar in front of your thighs.', 'Pull it up along your body, leading with your elbows, to lower-chest height.', 'Lower under control.'], ['A wider grip is usually easier on the shoulders.', 'Stop if you feel pinching in the shoulder.']),
  shrug: P('Shrug', ['Hold the weight with your arms straight.', 'Lift your shoulders straight up toward your ears.', 'Pause, then lower slowly to a full stretch.'], ['Don’t roll your shoulders.', 'Hold the top for a moment each rep.']),
  carry: P('Loaded carry', ['Pick up the weight with a neutral spine.', 'Walk with short, controlled steps, standing tall.', 'Set the weight down under control.'], ['Log time in seconds in the reps column.', 'Keep your shoulders level and core braced.']),
  curl: P('Elbow flexion', ['Start with your arms extended and elbows near your sides.', 'Curl the weight up by bending at the elbow.', 'Squeeze at the top, then lower slowly to full extension.'], ['Keep your upper arm still.', 'Control the lowering phase.']),
  pushdown: P('Triceps extension', ['Stand tall with your elbows tucked at your sides.', 'Push the handle down until your arms are straight.', 'Let it rise under control until your forearms pass parallel to the floor.'], ['Keep your elbows pinned.', 'Lock out fully at the bottom.']),
  ohext: P('Overhead triceps extension', ['Start with the weight overhead, elbows pointing forward.', 'Lower the weight behind your head for a deep stretch.', 'Extend your elbows until your arms are straight.'], ['Keep your elbows from flaring wide.', 'This stretches the long head, so control the bottom.']),
  skull: P('Lying triceps extension', ['Lie on a bench with the weight above your shoulders.', 'Bend at the elbows to lower the weight toward your forehead or just behind your head.', 'Extend back to the start.'], ['Keep your upper arms still.', 'Move slowly at the bottom.']),
  tkick: P('Triceps kickback', ['Hinge forward with your upper arm parallel to your torso.', 'Extend your elbow until your arm is straight behind you.', 'Return under control.'], ['Keep your upper arm fixed.', 'Pause at full extension.']),
  squat: P('Squat', ['Set your feet about shoulder-width apart, core braced.', 'Sit down and slightly back, keeping your chest up.', 'Descend as deep as you can with good form.', 'Drive up through your whole foot.'], ['Keep your knees tracking in line with your toes.', 'Brace before every rep.']),
  legpress: P('Leg press', ['Sit with your back flat against the pad and feet about shoulder-width on the platform.', 'Release the safeties and lower the platform under control.', 'Press back up without slamming your knees into lockout.'], ['Keep your lower back on the pad.', 'Higher foot placement shifts work toward glutes and hamstrings.']),
  lunge: P('Lunge / split squat', ['Set up in a staggered stance.', 'Lower your back knee toward the floor.', 'Drive through your front foot to return to the top.'], ['A longer stride biases the glutes; a shorter one biases the quads.', 'Keep your torso tall and your front knee tracking over your toes.']),
  legext: P('Knee extension', ['Sit with the pad on your lower shins and knees aligned with the machine pivot.', 'Extend your legs until straight.', 'Lower under control.'], ['Pause briefly at the top.', 'Hold the handles to stay seated.']),
  legcurl: P('Knee flexion', ['Set the pad just above your heels.', 'Curl your heels toward your glutes.', 'Return slowly to full extension.'], ['Keep your hips down on the pad.', 'Control the lowering.']),
  nordic: P('Knee flexion (bodyweight)', ['Kneel with your ankles secured.', 'Lower your torso forward slowly, keeping your hips extended.', 'Use your hamstrings to pull back up, assisting with your hands if needed.'], ['Go slowly on the way down.', 'Use a band or your hands for assistance while you build strength.']),
  hipthrust: P('Hip extension', ['Set your upper back on a bench (or the floor for bridges), feet flat.', 'Drive through your heels to lift your hips.', 'Squeeze your glutes at the top, then lower under control.'], ['Tuck your chin and keep your ribs down.', 'Aim for vertical shins at the top.']),
  gkick: P('Glute kickback', ['Brace on the machine or cable with a slight forward lean.', 'Drive one leg back, extending at the hip.', 'Squeeze your glute, then return slowly.'], ['Don’t arch your lower back to get more range.', 'Keep your hips square.']),
  backext: P('Back extension', ['Set the pad at your hips.', 'Lower your torso by bending at the hips.', 'Raise back up until your body forms a straight line.'], ['For glute bias, round your upper back slightly and point your toes out.', 'Don’t hyperextend at the top.']),
  abduct: P('Hip abduction', ['Set up with your legs together.', 'Push your legs outward against the resistance.', 'Return slowly.'], ['Lean slightly forward to bias the upper glutes.', 'Control the return.']),
  adduct: P('Hip adduction', ['Set up with your legs apart against the pads.', 'Squeeze your legs together.', 'Return slowly to the stretch.'], ['Use a range you can control.', 'Don’t bounce out of the stretch.']),
  calf: P('Calf raise', ['Place the balls of your feet on the platform, heels free.', 'Lower your heels for a deep stretch.', 'Rise onto your toes as high as possible.'], ['Pause at the bottom to remove the bounce.', 'Straight knees bias the gastrocnemius; bent knees bias the soleus.']),
  tib: P('Tibialis raise', ['Lean against a wall with your heels forward.', 'Lift your toes toward your shins.', 'Lower slowly.'], ['High reps work well here.', 'Keep your knees straight.']),
  crunch: P('Trunk flexion', ['Set up with the resistance at your chest or head.', 'Curl your ribs toward your pelvis.', 'Return slowly without fully relaxing.'], ['Round your spine; don’t just hinge at the hips.', 'Exhale as you crunch.']),
  legraise: P('Leg raise', ['Hang or lie with your legs extended.', 'Curl your pelvis up as you raise your legs or knees.', 'Lower slowly without swinging.'], ['Tilting your pelvis up is what works the abs.', 'Control the lowering.']),
  rollout: P('Anti-extension', ['Kneel holding the wheel or bar below your shoulders.', 'Roll forward as far as you can without your lower back sagging.', 'Pull back to the start with your abs.'], ['Keep your pelvis slightly tucked.', 'Shorten the range until you’re strong enough.']),
  plank: P('Isometric hold', ['Set up with your body in a straight line.', 'Brace your abs and glutes.', 'Hold for time.'], ['Log seconds in the reps column.', 'Stop when your hips start to sag.']),
  antirot: P('Anti-rotation', ['Stand side-on to the cable, holding the handle at your chest.', 'Press the handle straight out and resist the rotation.', 'Return it to your chest under control.'], ['Stay square to the front.', 'Keep your hips still.']),
  rotation: P('Rotation', ['Set up with a braced core.', 'Rotate through your torso against the resistance.', 'Return under control.'], ['Rotate from your mid-back, not your lower back.', 'Move steadily; don’t whip the weight.']),
  stability: P('Core stability', ['Set up on your back or on your hands and knees.', 'Extend the opposite arm and leg while keeping your trunk still.', 'Return and switch sides.'], ['Move slowly.', 'Keep your lower back neutral.']),
  olympic: P('Olympic lift', ['Set up with the bar over your mid-foot.', 'Pull explosively, extending your hips, knees and ankles.', 'Pull yourself under the bar and receive it.', 'Stand up to finish.'], ['Technique comes first; these lifts benefit from coaching.', 'Use bumper plates and a platform when dropping the bar.']),
  wrist: P('Wrist curl', ['Rest your forearms on a bench or your thighs, wrists over the edge.', 'Curl the weight up using only your wrists.', 'Lower slowly to a full stretch.'], ['Use a full range of motion.', 'High reps work well.']),
  grip: P('Grip', ['Grip the implement firmly.', 'Hold, roll or squeeze as the exercise requires.', 'Stop before your grip fully fails.'], ['For holds, log seconds in the reps column.', 'Chalk helps.']),
};

const VAR_STEPS = [
  [/incline/i, 'Set the bench to about 30–45 degrees.'],
  [/decline/i, 'Set the bench to a slight decline and secure your legs.'],
  [/low-to-high/i, 'Set the cables at the lowest position and press or sweep upward.'],
  [/high-to-low/i, 'Set the cables above shoulder height and press or sweep downward.'],
  [/chest-supported/i, 'Lie chest-down on an incline bench or the machine pad.'],
  [/^seated/i, 'Sit upright with your back supported.'],
];

const RAW = `
# Chest
Barbell Bench Press;Barbell Bench Press;Flat;chest;frontDelts triceps;BB;hpress;
Incline Barbell Bench Press;Barbell Bench Press;Incline;chest:Upper;frontDelts triceps;BB;hpress;
Decline Barbell Bench Press;Barbell Bench Press;Decline;chest:Lower;triceps frontDelts;BB;hpress;
Dumbbell Bench Press;Dumbbell Bench Press;Flat;chest;frontDelts triceps;DB;hpress;
Incline Dumbbell Bench Press;Dumbbell Bench Press;Incline;chest:Upper;frontDelts triceps;DB;hpress;
Decline Dumbbell Bench Press;Dumbbell Bench Press;Decline;chest:Lower;triceps frontDelts;DB;hpress;
Neutral-Grip Dumbbell Press;Dumbbell Bench Press;Neutral grip;chest;triceps frontDelts;DB;hpress;
Dumbbell Squeeze Press;Dumbbell Bench Press;Squeeze;chest:Inner;triceps frontDelts;DB;hpress;
Machine Chest Press;Machine Chest Press;Flat;chest;frontDelts triceps;SM;hpress;
Incline Machine Press;Machine Chest Press;Incline;chest:Upper;frontDelts triceps;SM;hpress;
Decline Machine Press;Machine Chest Press;Decline;chest:Lower;triceps;SM;hpress;
Plate-Loaded Chest Press;Plate-Loaded Chest Press;;chest;frontDelts triceps;PL;hpress;
Smith Machine Bench Press;Smith Machine Bench Press;Flat;chest;frontDelts triceps;SX;hpress;
Smith Machine Incline Press;Smith Machine Bench Press;Incline;chest:Upper;frontDelts triceps;SX;hpress;
Smith Machine Decline Press;Smith Machine Bench Press;Decline;chest:Lower;triceps;SX;hpress;
Cable Chest Press;Cable Chest Press;Mid;chest;frontDelts triceps;CB;hpress;
Low-to-High Cable Press;Cable Chest Press;Low-to-high;chest:Upper;frontDelts triceps;CB;hpress;
High-to-Low Cable Press;Cable Chest Press;High-to-low;chest:Lower;triceps;CB;hpress;
Dumbbell Fly;Dumbbell Fly;Flat;chest;frontDelts;DB;fly;
Incline Dumbbell Fly;Dumbbell Fly;Incline;chest:Upper;frontDelts;DB;fly;
Decline Dumbbell Fly;Dumbbell Fly;Decline;chest:Lower;;DB;fly;
Cable Fly;Cable Fly;Mid;chest;frontDelts;CB;fly;
Cable Crossover;Cable Fly;Crossover;chest:Inner;frontDelts;CB;fly;
Low-to-High Cable Fly;Cable Fly;Low-to-high;chest:Upper;frontDelts;CB;fly;
High-to-Low Cable Fly;Cable Fly;High-to-low;chest:Lower;;CB;fly;
Pec Deck;Pec Deck;;chest;frontDelts;SM;fly;
Push-Up;Push-Up;Standard;chest;triceps frontDelts core;BW;pushup;
Wide-Grip Push-Up;Push-Up;Wide;chest;frontDelts;BW;pushup;
Deficit Push-Up;Push-Up;Deficit;chest;triceps frontDelts;BW;pushup;
Weighted Push-Up;Push-Up;Weighted;chest;triceps frontDelts core;WB;pushup;
Chest Dip;Dip;Chest (forward lean);chest:Lower;triceps frontDelts;BW;dip;
Weighted Chest Dip;Dip;Weighted chest;chest:Lower;triceps frontDelts;WB;dip;
Triceps Dip;Dip;Triceps (upright);triceps;chest frontDelts;BW;dip;
Weighted Dip;Dip;Weighted triceps;triceps;chest frontDelts;WB;dip;
# Back
Conventional Deadlift;Deadlift;Conventional;lowerBack;glutes hamstrings traps forearms quads;BB;hinge;
Sumo Deadlift;Deadlift;Sumo;glutes;adductors quads hamstrings lowerBack;BB;hinge;
Trap-Bar Deadlift;Deadlift;Trap bar;glutes;quads hamstrings traps lowerBack;TB;hinge;
Rack Pull;Deadlift;Rack pull;lowerBack;traps glutes upperBack forearms;BB;hinge;
Barbell Bent-Over Row;Barbell Row;Bent-over;upperBack;lats rearDelts biceps lowerBack;BB;row;
Pendlay Row;Barbell Row;Pendlay;upperBack;lats rearDelts biceps;BB;row;
Yates Row;Barbell Row;Yates (underhand);lats;upperBack biceps;BB;row;
T-Bar Row;T-Bar Row;Standing;upperBack;lats rearDelts biceps;PL;row;
Chest-Supported T-Bar Row;T-Bar Row;Chest-supported;upperBack;lats rearDelts biceps;PL;row;
Landmine Row;Landmine Row;Two-arm;upperBack;lats biceps;LM;row;
Meadows Row;Landmine Row;Meadows;lats;upperBack rearDelts biceps;LM;row;u
One-Arm Dumbbell Row;Dumbbell Row;One-arm;lats;upperBack rearDelts biceps;DB;row;u
Chest-Supported Dumbbell Row;Dumbbell Row;Chest-supported;upperBack;lats rearDelts biceps;DB;row;
Seal Row;Seal Row;;upperBack;lats rearDelts biceps;BB;row;
Machine Row;Machine Row;Selectorized;upperBack;lats rearDelts biceps;SM;row;
Plate-Loaded Row;Machine Row;Plate-loaded;upperBack;lats rearDelts biceps;PL;row;
Seated Cable Row;Cable Row;Medium grip;upperBack;lats rearDelts biceps;CB;row;
Wide-Grip Cable Row;Cable Row;Wide grip;upperBack;rearDelts lats;CB;row;
Close-Grip Cable Row;Cable Row;Close grip;lats;upperBack biceps;CB;row;
One-Arm Cable Row;Cable Row;One-arm;lats;upperBack biceps;CB;row;u
Lat Pulldown;Lat Pulldown;Medium pronated;lats;upperBack biceps;CB;pulldown;
Wide-Grip Lat Pulldown;Lat Pulldown;Wide pronated;lats;upperBack rearDelts;CB;pulldown;
Close-Grip Lat Pulldown;Lat Pulldown;Close neutral;lats;biceps upperBack;CB;pulldown;
Neutral-Grip Lat Pulldown;Lat Pulldown;Neutral;lats;biceps upperBack;CB;pulldown;
Reverse-Grip Lat Pulldown;Lat Pulldown;Supinated;lats;biceps;CB;pulldown;
Single-Arm Lat Pulldown;Lat Pulldown;Single arm;lats;biceps;CB;pulldown;u
Straight-Arm Pulldown;Pullover;Straight-arm cable;lats;triceps core;CB;pullover;
Cable Pullover;Pullover;Cable;lats;triceps chest;CB;pullover;
Machine Pullover;Pullover;Machine;lats;triceps;SM;pullover;
Dumbbell Pullover;Pullover;Dumbbell;lats;chest triceps;DB;pullover;
Pull-Up;Pull-Up;Pronated;lats;upperBack biceps forearms;BW;pullup;
Weighted Pull-Up;Pull-Up;Weighted pronated;lats;upperBack biceps forearms;WB;pullup;
Wide-Grip Pull-Up;Pull-Up;Wide;lats;upperBack rearDelts;BW;pullup;
Neutral-Grip Pull-Up;Pull-Up;Neutral;lats;biceps upperBack;BW;pullup;
Chin-Up;Pull-Up;Chin-up (supinated);lats;biceps upperBack;BW;pullup;
Weighted Chin-Up;Pull-Up;Weighted chin-up;lats;biceps upperBack;WB;pullup;
# Shoulders
Standing Barbell Overhead Press;Barbell Overhead Press;Standing;frontDelts;sideDelts triceps traps core;BB;vpress;
Seated Barbell Shoulder Press;Barbell Overhead Press;Seated;frontDelts;sideDelts triceps;BB;vpress;
Push Press;Barbell Overhead Press;Push press;frontDelts;triceps quads glutes traps;BB;vpress;
Dumbbell Shoulder Press;Dumbbell Shoulder Press;Seated;frontDelts;sideDelts triceps;DB;vpress;
Arnold Press;Dumbbell Shoulder Press;Arnold;frontDelts;sideDelts triceps;DB;vpress;
Single-Arm Dumbbell Shoulder Press;Dumbbell Shoulder Press;Single-arm;frontDelts;sideDelts triceps obliques;DB;vpress;u
Machine Shoulder Press;Machine Shoulder Press;;frontDelts;sideDelts triceps;SM;vpress;
Smith Machine Shoulder Press;Smith Machine Shoulder Press;;frontDelts;sideDelts triceps;SX;vpress;
Landmine Press;Landmine Press;;frontDelts;chest triceps core;LM;vpress;u
Dumbbell Lateral Raise;Lateral Raise;Standing dumbbell;sideDelts;traps;DB;lateral;
Seated Dumbbell Lateral Raise;Lateral Raise;Seated dumbbell;sideDelts;;DB;lateral;
Leaning Lateral Raise;Lateral Raise;Leaning;sideDelts;;DB;lateral;u
Cable Lateral Raise;Lateral Raise;Cable;sideDelts;;CB;lateral;u
Behind-the-Back Cable Lateral Raise;Lateral Raise;Behind-the-back cable;sideDelts;rearDelts;CB;lateral;u
Machine Lateral Raise;Lateral Raise;Machine;sideDelts;;SM;lateral;
Dumbbell Front Raise;Front Raise;Dumbbell;frontDelts;chest;DB;frontraise;
Cable Front Raise;Front Raise;Cable;frontDelts;chest;CB;frontraise;
Plate Front Raise;Front Raise;Plate;frontDelts;chest traps;OT;frontraise;
Rear-Delt Dumbbell Fly;Rear-Delt Fly;Bent-over dumbbell;rearDelts;upperBack traps;DB;reardelt;
Incline Rear-Delt Fly;Rear-Delt Fly;Chest-supported incline;rearDelts;upperBack;DB;reardelt;
Reverse Pec Deck;Rear-Delt Fly;Reverse pec deck;rearDelts;upperBack;SM;reardelt;
Cable Rear-Delt Fly;Rear-Delt Fly;Cable;rearDelts;upperBack;CB;reardelt;
Face Pull;Face Pull;;rearDelts;upperBack traps;CB;facepull;
Upright Row;Upright Row;;sideDelts;traps frontDelts biceps;BB;upright;
# Traps
Barbell Shrug;Shrug;Barbell;traps;forearms;BB;shrug;
Dumbbell Shrug;Shrug;Dumbbell;traps;forearms;DB;shrug;
Smith Machine Shrug;Shrug;Smith machine;traps;forearms;SX;shrug;
Machine Shrug;Shrug;Machine;traps;;SM;shrug;
Trap-Bar Shrug;Shrug;Trap bar;traps;forearms;TB;shrug;
Cable Shrug;Shrug;Cable;traps;;CB;shrug;
Behind-the-Back Barbell Shrug;Shrug;Behind-the-back;traps;upperBack;BB;shrug;
Incline Dumbbell Shrug;Shrug;Incline;traps:Mid;upperBack;DB;shrug;
Farmer's Carry;Loaded Carry;Farmer's;traps;forearms core glutes;DB;carry;t
Suitcase Carry;Loaded Carry;Suitcase;obliques;forearms traps;DB;carry;ut
# Biceps
Barbell Curl;Barbell Curl;Straight bar;biceps;forearms;BB;curl;
EZ-Bar Curl;Barbell Curl;EZ bar;biceps;forearms;EZ;curl;
Drag Curl;Barbell Curl;Drag;biceps;;BB;curl;
Dumbbell Curl;Dumbbell Curl;Standing;biceps;forearms;DB;curl;
Alternating Dumbbell Curl;Dumbbell Curl;Alternating;biceps;forearms;DB;curl;u
Seated Dumbbell Curl;Dumbbell Curl;Seated;biceps;;DB;curl;
Incline Dumbbell Curl;Dumbbell Curl;Incline;biceps:Long head;;DB;curl;
Spider Curl;Dumbbell Curl;Spider;biceps:Short head;;DB;curl;
Concentration Curl;Dumbbell Curl;Concentration;biceps;;DB;curl;u
Zottman Curl;Dumbbell Curl;Zottman;biceps;forearms;DB;curl;
Hammer Curl;Hammer Curl;Dumbbell;biceps:Brachialis;forearms;DB;curl;
Cross-Body Hammer Curl;Hammer Curl;Cross-body;biceps:Brachialis;forearms;DB;curl;u
Rope Hammer Curl;Hammer Curl;Cable rope;biceps:Brachialis;forearms;CB;curl;
Preacher Curl;Preacher Curl;Straight bar;biceps:Short head;;BB;curl;
EZ-Bar Preacher Curl;Preacher Curl;EZ bar;biceps:Short head;forearms;EZ;curl;
Dumbbell Preacher Curl;Preacher Curl;Dumbbell;biceps:Short head;;DB;curl;u
Machine Preacher Curl;Preacher Curl;Machine;biceps;;SM;curl;
Cable Curl;Cable Curl;Straight bar;biceps;forearms;CB;curl;
Bayesian Cable Curl;Cable Curl;Bayesian;biceps:Long head;;CB;curl;u
High Cable Curl;Cable Curl;High;biceps:Short head;;CB;curl;
Reverse Curl;Reverse Curl;EZ bar;forearms;biceps;EZ;curl;
Barbell Reverse Curl;Reverse Curl;Barbell;forearms;biceps;BB;curl;
Dumbbell Reverse Curl;Reverse Curl;Dumbbell;forearms;biceps;DB;curl;
# Triceps
Cable Pushdown;Triceps Pushdown;V-bar;triceps;;CB;pushdown;
Rope Pushdown;Triceps Pushdown;Rope;triceps:Lateral head;;CB;pushdown;
Straight-Bar Pushdown;Triceps Pushdown;Straight bar;triceps;;CB;pushdown;
Reverse-Grip Pushdown;Triceps Pushdown;Reverse grip;triceps:Medial head;forearms;CB;pushdown;
Single-Arm Pushdown;Triceps Pushdown;Single arm;triceps;;CB;pushdown;u
Overhead Rope Extension;Overhead Triceps Extension;Cable rope;triceps:Long head;;CB;ohext;
Overhead Cable Extension;Overhead Triceps Extension;Cable bar;triceps:Long head;;CB;ohext;
Dumbbell Overhead Extension;Overhead Triceps Extension;Dumbbell;triceps:Long head;;DB;ohext;
Single-Arm Dumbbell Overhead Extension;Overhead Triceps Extension;Single-arm dumbbell;triceps:Long head;;DB;ohext;u
EZ-Bar Skull Crusher;Skull Crusher;EZ bar;triceps;;EZ;skull;
Barbell Skull Crusher;Skull Crusher;Barbell;triceps;;BB;skull;
Dumbbell Skull Crusher;Skull Crusher;Dumbbell;triceps;;DB;skull;
Incline Skull Crusher;Skull Crusher;Incline;triceps:Long head;;EZ;skull;
Close-Grip Bench Press;Close-Grip Bench Press;Barbell;triceps;chest frontDelts;BB;hpress;
Smith Machine Close-Grip Bench Press;Close-Grip Bench Press;Smith machine;triceps;chest frontDelts;SX;hpress;
JM Press;JM Press;;triceps;chest;BB;skull;
Bench Dip;Bench Dip;;triceps;frontDelts chest;BW;dip;
Cable Kickback;Triceps Kickback;Cable;triceps;;CB;tkick;u
Dumbbell Kickback;Triceps Kickback;Dumbbell;triceps;;DB;tkick;u
Machine Triceps Extension;Machine Triceps Extension;;triceps;;SM;pushdown;
# Forearms and grip
Barbell Wrist Curl;Wrist Curl;Barbell;forearms:Flexors;;BB;wrist;
Dumbbell Wrist Curl;Wrist Curl;Dumbbell;forearms:Flexors;;DB;wrist;
Cable Wrist Curl;Wrist Curl;Cable;forearms:Flexors;;CB;wrist;
Reverse Wrist Curl;Wrist Curl;Reverse;forearms:Extensors;;BB;wrist;
Wrist Roller;Wrist Roller;;forearms;frontDelts;OT;grip;
Plate Pinch;Grip Hold;Plate pinch;forearms:Grip;;OT;grip;t
Dead Hang;Grip Hold;Dead hang;forearms:Grip;lats;BW;grip;t
Grip Trainer;Grip Trainer;;forearms:Grip;;OT;grip;
# Quadriceps
Back Squat;Barbell Squat;Back;quads;glutes adductors lowerBack;BB;squat;
High-Bar Squat;Barbell Squat;High bar;quads;glutes adductors;BB;squat;
Front Squat;Barbell Squat;Front;quads;glutes upperBack core;BB;squat;
Safety-Bar Squat;Barbell Squat;Safety bar;quads;glutes upperBack;OT;squat;
Smith Machine Squat;Smith Machine Squat;;quads;glutes;SX;squat;
Hack Squat;Machine Squat;Hack;quads;glutes;PL;squat;
Pendulum Squat;Machine Squat;Pendulum;quads;glutes;PL;squat;
Belt Squat;Machine Squat;Belt;quads;glutes adductors;PL;squat;
Goblet Squat;Goblet Squat;;quads;glutes core;DB;squat;
Cyclist Squat;Cyclist Squat;;quads:Vastus medialis;;DB;squat;
Sissy Squat;Sissy Squat;;quads:Rectus femoris;;BW;squat;
Leg Press;Leg Press;45-degree;quads;glutes adductors;PL;legpress;
Horizontal Leg Press;Leg Press;Horizontal;quads;glutes;SM;legpress;
Single-Leg Press;Leg Press;Single leg;quads;glutes;PL;legpress;u
Bulgarian Split Squat;Split Squat;Bulgarian;quads;glutes adductors;DB;lunge;u
Bulgarian Split Squat — Glute Bias;Split Squat;Bulgarian, glute bias;glutes;quads hamstrings adductors;DB;lunge;u
Front-Foot-Elevated Split Squat;Split Squat;Front foot elevated;quads;glutes;DB;lunge;u
Smith Machine Split Squat;Split Squat;Smith machine;quads;glutes;SX;lunge;u
Walking Lunge;Lunge;Walking;quads;glutes adductors;DB;lunge;u
Reverse Lunge;Lunge;Reverse;glutes;quads adductors;DB;lunge;u
Forward Lunge;Lunge;Forward;quads;glutes;DB;lunge;u
Step-Up;Step-Up;;quads;glutes;DB;lunge;u
Leg Extension;Leg Extension;Two legs;quads;;SM;legext;
Single-Leg Extension;Leg Extension;Single leg;quads;;SM;legext;u
# Hamstrings
Romanian Deadlift;Romanian Deadlift;Barbell;hamstrings;glutes lowerBack forearms;BB;hinge;
Dumbbell Romanian Deadlift;Romanian Deadlift;Dumbbell;hamstrings;glutes lowerBack;DB;hinge;
Single-Leg Romanian Deadlift;Romanian Deadlift;Single leg;hamstrings;glutes core;DB;hinge;u
Barbell Stiff-Leg Deadlift;Stiff-Leg Deadlift;;hamstrings;lowerBack glutes;BB;hinge;
Good Morning;Good Morning;;hamstrings;lowerBack glutes;BB;hinge;
Seated Leg Curl;Leg Curl;Seated;hamstrings;calves;SM;legcurl;
Lying Leg Curl;Leg Curl;Lying;hamstrings;calves;SM;legcurl;
Standing Single-Leg Curl;Leg Curl;Standing single leg;hamstrings;;SM;legcurl;u
Cable Leg Curl;Leg Curl;Cable;hamstrings;;CB;legcurl;u
Stability-Ball Leg Curl;Leg Curl;Stability ball;hamstrings;glutes core;OT;legcurl;
Nordic Hamstring Curl;Nordic Hamstring Curl;;hamstrings;calves;BW;nordic;
Glute-Ham Raise;Glute-Ham Raise;;hamstrings;glutes lowerBack;OT;nordic;
# Glutes
Barbell Hip Thrust;Hip Thrust;Barbell;glutes;hamstrings quads;BB;hipthrust;
Smith Machine Hip Thrust;Hip Thrust;Smith machine;glutes;hamstrings;SX;hipthrust;
Machine Hip Thrust;Hip Thrust;Machine;glutes;hamstrings;PL;hipthrust;
Dumbbell Hip Thrust;Hip Thrust;Dumbbell;glutes;hamstrings;DB;hipthrust;
Single-Leg Hip Thrust;Hip Thrust;Single leg;glutes;hamstrings core;BW;hipthrust;u
Glute Bridge;Glute Bridge;;glutes;hamstrings;BW;hipthrust;
Cable Pull-Through;Cable Pull-Through;;glutes;hamstrings lowerBack;CB;hinge;
Cable Glute Kickback;Glute Kickback;Cable;glutes;hamstrings;CB;gkick;u
Machine Glute Kickback;Glute Kickback;Machine;glutes;hamstrings;SM;gkick;u
45-Degree Back Extension;Back Extension;Standard;lowerBack;glutes hamstrings;BW;backext;
Weighted Back Extension;Back Extension;Weighted;lowerBack;glutes hamstrings;WB;backext;
45-Degree Back Extension — Glute Bias;Back Extension;Glute bias;glutes;hamstrings lowerBack;BW;backext;
Reverse Hyperextension;Reverse Hyperextension;;glutes;hamstrings lowerBack;OT;backext;
# Adductors and abductors
Hip Abduction Machine;Hip Abduction;Machine;abductors;glutes;SM;abduct;
Cable Hip Abduction;Hip Abduction;Cable;abductors;glutes;CB;abduct;u
Banded Hip Abduction;Hip Abduction;Band;abductors;glutes;RB;abduct;
Lateral Band Walk;Lateral Band Walk;;abductors;glutes;RB;abduct;
Hip Adduction Machine;Hip Adduction;Machine;adductors;;SM;adduct;
Cable Hip Adduction;Hip Adduction;Cable;adductors;;CB;adduct;u
Copenhagen Plank;Copenhagen Plank;;adductors;obliques core;BW;plank;ut
# Calves and tibialis
Standing Calf Raise;Calf Raise;Standing;calves:Gastrocnemius;;SM;calf;
Seated Calf Raise;Calf Raise;Seated;calves:Soleus;;PL;calf;
Leg-Press Calf Raise;Calf Raise;Leg press;calves;;PL;calf;
Smith Machine Calf Raise;Calf Raise;Smith machine;calves;;SX;calf;
Donkey Calf Raise;Calf Raise;Donkey;calves:Gastrocnemius;;OT;calf;
Single-Leg Calf Raise;Calf Raise;Single leg;calves;;DB;calf;u
Machine Calf Raise;Calf Raise;Machine;calves;;SM;calf;
Calf Press;Calf Raise;Calf press;calves;;SM;calf;
Tibialis Raise;Tibialis Raise;;tibialis;;OT;tib;
# Abs and core
Cable Crunch;Crunch;Cable;abs;obliques;CB;crunch;
Machine Crunch;Crunch;Machine;abs;;SM;crunch;
Weighted Crunch;Crunch;Weighted;abs;;WB;crunch;
Decline Crunch;Crunch;Decline;abs;;BW;crunch;
Sit-Up;Sit-Up;Floor;abs;;BW;crunch;
Decline Sit-Up;Sit-Up;Decline;abs;;BW;crunch;
Hanging Leg Raise;Leg Raise;Hanging;abs:Lower;obliques forearms;BW;legraise;
Hanging Knee Raise;Leg Raise;Hanging knee;abs:Lower;forearms;BW;legraise;
Captain's-Chair Leg Raise;Leg Raise;Captain's chair;abs:Lower;;BW;legraise;
Lying Leg Raise;Leg Raise;Lying;abs:Lower;;BW;legraise;
Reverse Crunch;Reverse Crunch;;abs:Lower;;BW;legraise;
Ab-Wheel Rollout;Rollout;Ab wheel;abs;lats core;OT;rollout;
Barbell Rollout;Rollout;Barbell;abs;lats core;BB;rollout;
Plank;Plank;Front;core;abs;BW;plank;t
Weighted Plank;Plank;Weighted;core;abs;WB;plank;t
Side Plank;Plank;Side;obliques;core;BW;plank;ut
Pallof Press;Pallof Press;;core:Anti-rotation;obliques;CB;antirot;u
Cable Woodchop;Cable Woodchop;;obliques;core;CB;rotation;u
Russian Twist;Russian Twist;;obliques;abs;BW;rotation;
Dead Bug;Dead Bug;;core;abs;BW;stability;
Bird Dog;Bird Dog;;lowerBack;core glutes;BW;stability;
# Full body / Olympic
Power Clean;Clean;Power clean;fullBody;traps quads glutes hamstrings;BB;olympic;
Hang Clean;Clean;Hang clean;fullBody;traps quads glutes;BB;olympic;
Clean and Press;Clean;Clean and press;fullBody;frontDelts traps quads glutes;BB;olympic;
Clean and Jerk;Clean;Clean and jerk;fullBody;frontDelts quads glutes traps;BB;olympic;
Snatch;Snatch;Full;fullBody;traps quads glutes frontDelts;BB;olympic;
Hang Snatch;Snatch;Hang;fullBody;traps glutes frontDelts;BB;olympic;
Thruster;Thruster;;fullBody;quads frontDelts glutes triceps;BB;vpress;
`;

export const slug = s => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function muscleLabel(e) {
  return (MUSCLES[e.primary] || 'Unknown') + (e.emphasis ? ` (${e.emphasis})` : '');
}

export function searchText(e) {
  return [e.name, e.family, e.variation, MUSCLES[e.primary], e.emphasis, ...(e.secondary || []).map(m => MUSCLES[m]), e.equipment, e.patternLabel]
    .filter(Boolean).join(' ').toLowerCase().replace(/[-–—]/g, ' ');
}

export function describe(e) {
  const target = (e.emphasis ? e.emphasis.toLowerCase() + ' ' : '') + (MUSCLES[e.primary] || '').toLowerCase();
  const sec = (e.secondary || []).map(m => MUSCLES[m].toLowerCase());
  const list = sec.length > 1 ? sec.slice(0, -1).join(', ') + ' and ' + sec.at(-1) : sec[0];
  return `${e.patternLabel || 'Exercise'} for the ${target}${list ? `, with the ${list} assisting` : ''}.`;
}

function parse(line) {
  const [name, family, variation, prim, sec, eq, pattern, flags = ''] = line.split(';').map(s => s.trim());
  const [primary, emphasis = ''] = prim.split(':');
  const p = PATTERNS[pattern];
  if (!p || !MUSCLES[primary] || !EQUIP[eq]) console.warn('LiftLog data issue:', line);
  const secondary = sec ? sec.split(/\s+/) : [];
  const unilateral = flags.includes('u');
  const extra = VAR_STEPS.filter(([re]) => re.test(variation)).map(([, s]) => s).slice(0, 1);
  const tips = [...p.tips];
  if (unilateral) tips.push('Log one side’s reps per set, then match them on the other side.');
  const id = slug(name);
  const e = {
    id, name,
    family: family || name, exerciseFamily: family || name,
    variation: variation || '',
    primary, primaryMuscle: primary, emphasis,
    secondary, secondaryMuscles: secondary,
    equipment: EQUIP[eq],
    movementPattern: pattern, patternLabel: p.label,
    unilateral, unilateralOrBilateral: unilateral ? 'unilateral' : 'bilateral',
    metric: flags.includes('t') ? 'time' : 'reps',
    instructions: [...extra, ...p.steps],
    tips,
    builtIn: true,
  };
  e._s = searchText(e);
  return e;
}

export const EXERCISES = RAW.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(parse);
export const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
if (Object.keys(EX_BY_ID).length !== EXERCISES.length) console.warn('LiftLog: duplicate exercise ids detected');
