import mongoose from "mongoose";


const attendanceSchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    time_in: {
      type: Date,
    },
    time_out: {
      type: Date,
    },
    total_hours: {
      type: Number, 
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'incomplete', 'approval pending', 'approved'],
      default: 'incomplete',
    },
    requested_edit: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  }, { timestamps: true });
  
  attendanceSchema.pre('save', function (next) {
    if (this.requested_edit) {
      this.status = 'approval pending';
    } else if (this.time_in && this.time_out) {
      this.status = 'completed';
  
      const timeIn = new Date(this.time_in);
      const timeOut = new Date(this.time_out);
      let diffMs = timeOut - timeIn;
  
      if (diffMs > 0) {
        let hours = diffMs / (1000 * 60 * 60);
  
        if (hours > 4) {
          hours = hours - 1;
        }
  
        this.total_hours = parseFloat(hours.toFixed(2));
      }
    } else {
      this.status = 'incomplete';
    }
  
    this.updated_at = Date.now();
    next();
  });
  
  /** Admin Approval Method **/
  attendanceSchema.methods.approveAttendance = function () {
    this.status = 'approved';
    this.requested_edit = false;
    return this.save();
  };
  
  export const Attendance = mongoose.model('Attendance', attendanceSchema);
  