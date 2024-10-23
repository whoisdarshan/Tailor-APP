const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TailorSkillMaster = Schema({
    tailor_id: { type: mongoose.Schema.Types.ObjectId },
    skill_id: { type: mongoose.Schema.Types.ObjectId },
    sub_skill_id: { type: mongoose.Schema.Types.ObjectId},
    deleted_at: { type: Date, default: null }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('tailor_skill_master', TailorSkillMaster);