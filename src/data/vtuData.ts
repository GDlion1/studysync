
export const vtuBranches = [
    { id: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'ISE', name: 'Information Science & Engineering' },
    { id: 'ECE', name: 'Electronics & Communication' },
    { id: 'ME', name: 'Mechanical Engineering' },
    { id: 'CV', name: 'Civil Engineering' },
    { id: 'AI', name: 'Artificial Intelligence & ML' },
];

export const vtuSemesters = [1, 2, 3, 4, 5, 6, 7];

export const vtuSubjects: Record<string, Record<number, { code: string; name: string }[]>> = {
    CSE: {
        1: [
            { code: '22MATS11', name: 'Mathematics for CSE Stream - I' },
            { code: '22PHYS12', name: 'Physics for CSE Stream' },
            { code: '22POP13', name: 'Principles of Programming using C' },
            { code: '22ENG16', name: 'Communicative English' },
            { code: '22IDT18', name: 'Innovation and Design Thinking' }
        ],
        2: [
            { code: '22MATS21', name: 'Mathematics for CSE Stream - II' },
            { code: '22CHEM22', name: 'Chemistry for CSE Stream' },
            { code: '22PLC25B', name: 'Introduction to Python Programming' },
            { code: '22ENG26', name: 'Professional Writing Skills in English' },
            { code: '22SFH28', name: 'Scientific Foundations of Health' }
        ],
        3: [
            { code: '22MAT31', name: 'Mathematics for Computer Science - III' },
            { code: '22CS32', name: 'Digital Design and Computer Organization' },
            { code: '22CS33', name: 'Operating Systems' },
            { code: '22CS34', name: 'Data Structures and Applications' },
            { code: '22CS35', name: 'Object Oriented Programming with Java' }
        ],
        4: [
            { code: '22MAT41', name: 'Mathematical Foundations for Computing' },
            { code: '22CS42', name: 'Design and Analysis of Algorithms' },
            { code: '22CS43', name: 'Microcontrollers and Embedded Systems' },
            { code: '22CS44', name: 'Biology for Engineers' },
            { code: '22CS45', name: 'Constitution of India & Professional Ethics' }
        ],
        5: [
            { code: '22CS51', name: 'Automata Theory and Computability' },
            { code: '22CS52', name: 'Computer Networks' },
            { code: '22CS53', name: 'Database Management Systems' },
            { code: '22CS54', name: 'Artificial Intelligence and Machine Learning' },
            { code: '22CS55', name: 'Research Methodology and IPR' }
        ],
        6: [
            { code: '22CS61', name: 'Software Engineering & Project Management' },
            { code: '22CS62', name: 'Full Stack Development' },
            { code: '22CS63', name: 'Data Science and Visualization' },
            { code: '22CS64', name: 'Professional Elective - I' },
            { code: '22CS65', name: 'Open Elective - I' }
        ],
        7: [
            { code: '22CS71', name: 'Professional Elective - II' },
            { code: '22CS72', name: 'Professional Elective - III' },
            { code: '22CS73', name: 'Open Elective - II' },
            { code: '22CS74', name: 'Project Work Phase - 1' }
        ]
    },
    ISE: {
        1: [
            { code: '22MATS11', name: 'Mathematics for CSE Stream - I' },
            { code: '22PHYS12', name: 'Physics for CSE Stream' },
            { code: '22POP13', name: 'Principles of Programming using C' },
            { code: '22ENG16', name: 'Communicative English' },
            { code: '22IDT18', name: 'Innovation and Design Thinking' }
        ],
        2: [
            { code: '22MATS21', name: 'Mathematics for CSE Stream - II' },
            { code: '22CHEM22', name: 'Chemistry for CSE Stream' },
            { code: '22PLC25B', name: 'Introduction to Python Programming' },
            { code: '22ENG26', name: 'Professional Writing Skills in English' },
            { code: '22SFH28', name: 'Scientific Foundations of Health' }
        ],
        3: [
            { code: '22MAT31', name: 'Mathematics for Computer Science - III' },
            { code: '22IS32', name: 'Digital Electronics and Microprocessors' },
            { code: '22IS33', name: 'Operating Systems' },
            { code: '22IS34', name: 'Data Structures and Applications' },
            { code: '22IS35', name: 'Object Oriented Programming with Java' }
        ],
        4: [
            { code: '22MAT41', name: 'Mathematical Foundations for Computing' },
            { code: '22IS42', name: 'Design and Analysis of Algorithms' },
            { code: '22IS43', name: 'Database Management Systems' },
            { code: '22IS44', name: 'Object Oriented Modeling and Design' },
            { code: '22IS45', name: 'User Interface Design' }
        ],
        5: [
            { code: '22IS51', name: 'Software Engineering' },
            { code: '22IS52', name: 'Computer Networks' },
            { code: '22IS53', name: 'Web Technology and its Applications' },
            { code: '22IS54', name: 'Data Mining and Warehousing' },
            { code: '22IS55', name: 'Unix Programming' }
        ],
        6: [
            { code: '22IS61', name: 'File Structures' },
            { code: '22IS62', name: 'Software Testing' },
            { code: '22IS63', name: 'Professional Elective - I' },
            { code: '22IS64', name: 'Open Elective - I' },
            { code: '22IS65', name: 'Mini Project' }
        ],
        7: [
            { code: '22IS71', name: 'Professional Elective - II' },
            { code: '22IS72', name: 'Professional Elective - III' },
            { code: '22IS73', name: 'Open Elective - II' },
            { code: '22IS74', name: 'Project Work Phase - 1' }
        ]
    },
    ECE: {
        1: [
            { code: '22MATE11', name: 'Mathematics for EEE Stream - I' },
            { code: '22PHY12', name: 'Physics for EEE Stream' },
            { code: '22BEE13', name: 'Basic Electrical Engineering' },
            { code: '22ENG16', name: 'Communicative English' },
            { code: '22IDT18', name: 'Innovation and Design Thinking' }
        ],
        2: [
            { code: '22MATE21', name: 'Mathematics for EEE Stream - II' },
            { code: '22CHEM22', name: 'Chemistry for EEE Stream' },
            { code: '22BEC25', name: 'Basic Electronics' },
            { code: '22ENG26', name: 'Professional Writing Skills in English' },
            { code: '22SFH28', name: 'Scientific Foundations of Health' }
        ],
        3: [
            { code: '22EC31', name: 'Transform Calculus, Fourier Series' },
            { code: '22EC32', name: 'Digital Logic' },
            { code: '22EC33', name: 'Network Analysis' },
            { code: '22EC34', name: 'Analog Electronic Circuits' },
            { code: '22EC35', name: 'Electronic Instrumentation' }
        ],
        4: [
            { code: '22EC41', name: 'Complex Analysis, Probability and Statistical Methods' },
            { code: '22EC42', name: 'Analog and Digital Communication' },
            { code: '22EC43', name: 'Control Systems' },
            { code: '22EC44', name: 'Engineering Electromagnetics' },
            { code: '22EC45', name: 'Signals and Systems' }
        ],
        5: [
            { code: '22EC51', name: 'Digital Signal Processing' },
            { code: '22EC52', name: 'Microcontrollers' },
            { code: '22EC53', name: 'Information Theory and Coding' },
            { code: '22EC54', name: 'Professional Elective - I' },
            { code: '22EC55', name: 'Open Elective - I' }
        ],
        6: [
            { code: '22EC61', name: 'Computer Networks' },
            { code: '22EC62', name: 'VLSI Design' },
            { code: '22EC63', name: 'Professional Elective - II' },
            { code: '22EC64', name: 'Open Elective - II' },
            { code: '22EC65', name: 'Mini Project' }
        ],
        7: [
            { code: '22EC71', name: 'Professional Elective - III' },
            { code: '22EC72', name: 'Professional Elective - IV' },
            { code: '22EC73', name: 'Open Elective - III' },
            { code: '22EC74', name: 'Project Work Phase - 1' }
        ]
    },
    // Default fallback for other branches to prevent errors, using generic structure
    ME: {
        1: [{ code: '22MATM11', name: 'Mathematics for ME Stream - I' }],
        2: [{ code: '22MATM21', name: 'Mathematics for ME Stream - II' }],
        3: [{ code: '22ME31', name: 'Fluid Mechanics' }],
        4: [{ code: '22ME41', name: 'Material Science' }],
        5: [{ code: '22ME51', name: 'Design of Machine Elements' }],
        6: [{ code: '22ME61', name: 'Heat Transfer' }],
        7: [{ code: '22ME71', name: 'Project Work' }]
    },
    CV: {
        1: [{ code: '22MATC11', name: 'Mathematics for CV Stream - I' }],
        2: [{ code: '22MATC21', name: 'Mathematics for CV Stream - II' }],
        3: [{ code: '22CV31', name: 'Strength of Materials' }],
        4: [{ code: '22CV41', name: 'Analysis of Structures' }],
        5: [{ code: '22CV51', name: 'Geotechnical Engineering' }],
        6: [{ code: '22CV61', name: 'Transportation Engineering' }],
        7: [{ code: '22CV71', name: 'Project Work' }]
    },
    AI: {
        1: [{ code: '22MATS11', name: 'Mathematics for CSE Stream - I' }],
        2: [{ code: '22MATS21', name: 'Mathematics for CSE Stream - II' }],
        3: [{ code: '22AI31', name: 'Data Structures & Algorithms' }],
        4: [{ code: '22AI41', name: 'Machine Learning I' }],
        5: [{ code: '22AI51', name: 'Deep Learning' }],
        6: [{ code: '22AI61', name: 'Natural Language Processing' }],
        7: [{ code: '22AI71', name: 'Project Work' }]
    }
};
