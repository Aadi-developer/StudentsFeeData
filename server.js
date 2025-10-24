const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend"))); // serve frontend folder

// MongoDB connection (change DB name if different)
mongoose.connect("mongodb://127.0.0.1:27017/9thClass", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(()=> console.log("✅ MongoDB Connected"))
.catch(err=> console.log("❌ MongoDB connection error:", err));

// Schema + Model (use existing Section_A collection)
const studentSchema = new mongoose.Schema({
  name: String,
  class: String,
  email: String,
  phone: String,
  mother_name: String,
  father_name: String,
  totalFee: Number,
  paidAmount: Number
});

// Third argument is **existing collection name**
const Student = mongoose.model("Student", studentSchema, "Section_A");

// Route to check fee
app.get("/check-fee", async (req, res) => {
  try {
    const { name, email } = req.query;
    if (!name && !email) return res.status(400).json({ status: "error", message: "Provide name or email" });

    const query = {};
    if (name) query.name = { $regex: new RegExp("^" + name + "$", "i") };
    if (email) query.email = email;

    const student = await Student.findOne(query).lean();
    if (!student) return res.json({ status: "not_found" });

    const remaining = Math.max(0, (student.totalFee || 0) - (student.paidAmount || 0));
    const feeStatus = remaining === 0 ? "Paid" : "Pending";

    return res.json({
      status: "ok",
      student: {
        name: student.name,
        class: student.class,
        email: student.email,
        phone: student.phone,
        totalFee: student.totalFee,
        paidAmount: student.paidAmount,
      },
      feeStatus,
      remaining
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
