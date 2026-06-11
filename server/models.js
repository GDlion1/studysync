import mongoose from 'mongoose';

// ─── Profile ─────────────────────────────────────────────────────────────────
const profileSchema = new mongoose.Schema({
  user_id:    { type: String, required: true, unique: true },
  full_name:  { type: String, default: '' },
  usn:        { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  branch:     { type: String, default: '' },
  semester:   { type: String, default: '' },
  bio:        { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});
export const Profile = mongoose.model('Profile', profileSchema);

// ─── Group ────────────────────────────────────────────────────────────────────
const groupSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   { type: String, default: '' },
  type:          { type: String, enum: ['universal', 'private'], default: 'universal' },
  subject_code:  { type: String, default: '' },
  mother_tongue: { type: String, default: '' },
  admin_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  creator_id:    { type: String, default: '' },
  created_at:    { type: Date, default: Date.now },
});
export const Group = mongoose.model('Group', groupSchema);

// ─── GroupMember ──────────────────────────────────────────────────────────────
const groupMemberSchema = new mongoose.Schema({
  group_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  role:       { type: String, default: 'member' },
  joined_at:  { type: Date, default: Date.now },
});
export const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

// ─── GroupGoal ────────────────────────────────────────────────────────────────
const groupGoalSchema = new mongoose.Schema({
  group_id:   { type: String, required: true },
  title:      { type: String, required: true },
  due_date:   { type: String, default: '' },
  priority:   { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:     { type: String, enum: ['pending', 'completed'], default: 'pending' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  created_at: { type: Date, default: Date.now },
});
export const GroupGoal = mongoose.model('GroupGoal', groupGoalSchema);

// ─── ChatMessage ──────────────────────────────────────────────────────────────
const chatMessageSchema = new mongoose.Schema({
  group_id:     { type: String, required: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  content:      { type: String, default: '' },
  message_type: { type: String, enum: ['text', 'image', 'file', 'pdf'], default: 'text' },
  file_url:     { type: String, default: null },
  created_at:   { type: Date, default: Date.now },
});
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// ─── StudyResource ────────────────────────────────────────────────────────────
const studyResourceSchema = new mongoose.Schema({
  group_id:     { type: String, default: null },
  title:        { type: String, required: true },
  file_url:     { type: String, default: '' },
  file_type:    { type: String, default: 'file' },
  file_size:    { type: Number, default: 0 },
  subject_code: { type: String, default: '' },
  subject_name: { type: String, default: '' },
  branch:       { type: String, default: '' },
  semester:     { type: String, default: '' },
  uploaded_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  created_at:   { type: Date, default: Date.now },
});
export const StudyResource = mongoose.model('StudyResource', studyResourceSchema);

// ─── StudySession ─────────────────────────────────────────────────────────────
const studySessionSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  group_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  start_time:   { type: Date },
  end_time:     { type: Date },
  session_type: { type: String, default: 'group' },
  created_by:   { type: String, default: '' },
  created_at:   { type: Date, default: Date.now },
});
export const StudySession = mongoose.model('StudySession', studySessionSchema);
