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
    pending_time_in:{
      type: Date,
      default: null,
    },
    pending_time_out:{
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['completed', 'incomplete', 'pending', 'approved', 'rejected'],
      default: 'incomplete',
    },
    requested_edit: {
      type: Boolean,
      default: false,
    },
    request_reason: {
      type: String,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
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
  
  // attendanceSchema.pre('save', function (next) {
  //   if (this.requested_edit) {
  //     this.status = 'approval pending';
  //   } else if (this.time_in && this.time_out) {
  //     this.status = 'completed';
  
  //     const timeIn = new Date(this.time_in);
  //     const timeOut = new Date(this.time_out);
  //     let diffMs = timeOut - timeIn;
  
  //     if (diffMs > 0) {
  //       let hours = diffMs / (1000 * 60 * 60);
  
  //       if (hours > 4) {
  //         hours = hours - 1;
  //       }
  
  //       this.total_hours = parseFloat(hours.toFixed(2));
  //     }
  //   } else {
  //     this.status = 'incomplete';
  //   }
  
  //   this.updated_at = Date.now();
  //   next();
  // });
  
  // /** Admin Approval Method **/
  // attendanceSchema.methods.approveAttendance = function () {
  //   this.status = 'approved';
  //   this.requested_edit = false;
  //   return this.save();
  // };
  
  export const Attendance = mongoose.model('Attendance', attendanceSchema);
  