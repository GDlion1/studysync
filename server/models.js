import mongoose from 'mongoose';

// 1. Profiles (matches your 'profiles' table)
const profileSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true }, // We will generate this or use JWT logic
  full_name: { type: String, required: true },
  usn: { type: String },
  avatar_url: { type: String },
  created_at: { type: Date, default: Date.now }
});
export const Profile = mongoose.model('Profile', profileSchema);

// 2. Groups (matches your 'groups' table)
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, default: 'private' },
  mother_tongue: { type: String },
  subject_code: { type: String },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const Group = mongoose.model('Group', groupSchema);

// 3. Study Group Members
const groupMemberSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  joined_at: { type: Date, default: Date.now }
});
export const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

// 4. Group Goals
const groupGoalSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  due_date: { type: Date },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  created_at: { type: Date, default: Date.now }
});
export const GroupGoal = mongoose.model('GroupGoal', groupGoalSchema);

// 5. Chat Messages
const chatMessageSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// 6. Study Resources
const studyResourceSchema = new mongoose.Schema({
  group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  title: { type: String, required: true },
  file_url: { type: String, required: true },
  file_type: { type: String },
  created_at: { type: Date, default: Date.now }
});
export const StudyResource = mongoose.model('StudyResource', studyResourceSchema);
