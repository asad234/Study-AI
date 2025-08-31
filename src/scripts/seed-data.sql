-- Insert sample user (this would normally be handled by Supabase Auth)
INSERT INTO users (id, email, name, subscription_plan) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', 'John Doe', 'free')
ON CONFLICT (email) DO NOTHING;

-- Insert sample documents
INSERT INTO documents (id, user_id, name, file_path, file_type, file_size, status) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Biology Chapter 5.pdf', '/uploads/biology-ch5.pdf', 'application/pdf', 2048576, 'completed'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Cell Structure Notes.docx', '/uploads/cell-structure.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024000, 'completed'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Photosynthesis Slides.pptx', '/uploads/photosynthesis.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 3072000, 'completed')
ON CONFLICT (id) DO NOTHING;

-- Insert sample flashcards
INSERT INTO flashcards (document_id, user_id, question, answer, difficulty, subject, mastered) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'What is photosynthesis?', 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.', 'medium', 'Biology', false),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'What are the main components of a cell?', 'The main components of a cell include the cell membrane, cytoplasm, nucleus, mitochondria, and various organelles.', 'easy', 'Biology', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'What is the function of mitochondria?', 'Mitochondria are the powerhouses of the cell, responsible for producing ATP (energy) through cellular respiration.', 'medium', 'Biology', false),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'What is chlorophyll?', 'Chlorophyll is the green pigment in plants that captures light energy for photosynthesis.', 'easy', 'Biology', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample quiz
INSERT INTO quizzes (user_id, title, questions, score, completed_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Biology Chapter 5 Quiz', 
'[
  {
    "id": "q1",
    "question": "What is the primary function of mitochondria?",
    "options": ["Protein synthesis", "Energy production", "DNA replication", "Waste removal"],
    "correct_answer": 1,
    "explanation": "Mitochondria are known as the powerhouses of the cell.",
    "subject": "Biology",
    "difficulty": "medium"
  },
  {
    "id": "q2",
    "question": "Which process produces oxygen as a byproduct?",
    "options": ["Cellular respiration", "Photosynthesis", "Fermentation", "Glycolysis"],
    "correct_answer": 1,
    "explanation": "Photosynthesis produces oxygen as a byproduct when plants convert CO2 and water into glucose.",
    "subject": "Biology",
    "difficulty": "easy"
  }
]'::jsonb, 85, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert sample study sessions
INSERT INTO study_sessions (user_id, type, duration, score, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'flashcards', 1200, NULL, '{"cards_studied": 15, "cards_mastered": 8}'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 'quiz', 900, 85, '{"questions_answered": 10, "correct_answers": 8}'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 'chat', 600, NULL, '{"messages_sent": 12, "topics_discussed": ["photosynthesis", "cell structure"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert sample chat messages
INSERT INTO chat_messages (user_id, message, response, context_documents) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 
'Can you explain photosynthesis in simple terms?', 
'Photosynthesis is like a recipe that plants use to make their own food. They take in sunlight (like energy), water from their roots, and carbon dioxide from the air. Then they mix these ingredients together to create sugar (their food) and release oxygen as a bonus gift for us to breathe!', 
ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003']),
('550e8400-e29b-41d4-a716-446655440000', 
'What are the main parts of a plant cell?', 
'A plant cell has several important parts: the cell wall (protective outer layer), cell membrane (controls what goes in and out), nucleus (the control center), chloroplasts (where photosynthesis happens), mitochondria (power plants), and vacuole (storage space). Think of it like a tiny factory with different departments!', 
ARRAY['550e8400-e29b-41d4-a716-446655440002'])
ON CONFLICT (id) DO NOTHING;
