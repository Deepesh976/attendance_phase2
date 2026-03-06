const Activity = require('../../models/Activity');
const {
  calculateMonthlySummary,
  saveMonthlySummary,
  getPayrollCycleFromDate,
} = require('./monthlySummaryService');

/**
 * Regenerate monthly summaries for a SINGLE employee
 * 🔒 Payroll cycle: 21 → 20
 * 📊 Total days: FROM ATTENDANCE COUNTS
 */
const regenerateMonthlySummaryForEmployee = async (empId) => {
  if (!empId) return;

  const activities = await Activity.find({ empId }).sort({ date: 1 });
  if (!activities.length) return;

  /* =========================
     GROUP ACTIVITIES BY PAYROLL CYCLE (21 → 20)
  ========================= */
  const cycles = {};

  for (const act of activities) {
    const { year, month } = getPayrollCycleFromDate(act.date);
    const key = `${year}-${month}`;

    if (!cycles[key]) {
      cycles[key] = {
        empName: act.empName,
        year,
        month,
        activities: [],
      };
    }

    cycles[key].activities.push(act);
  }

  /* =========================
     GENERATE & SAVE SUMMARIES
  ========================= */
  for (const key of Object.keys(cycles)) {
    const { empName, activities, year, month } = cycles[key];
    if (!activities.length) continue;

    // 🔹 Calculate summary from activities
    const summary = calculateMonthlySummary(
      empId,
      empName,
      activities
    );

    if (!summary) continue;

    /* ======================================
       🔥 FINAL TOTAL DAYS (ATTENDANCE SOURCE)
    ====================================== */

    const totalPresent = Number(summary.totalPresent || 0);
    const totalAbsent = Number(summary.totalAbsent || 0);
    const totalWO = Number(summary.totalWOCount || 0);
    const totalHO = Number(summary.totalHOCount || 0);
    const totalALF = Number(summary.totalALF || 0);
    const totalALH = Number(summary.totalALH || 0);

    const finalTotalDays =
      totalPresent +
      totalAbsent +
      totalWO +
      totalHO +
      totalALF +
      totalALH;

    summary.totalDays = finalTotalDays;

    /* =========================
       DEBUG LOG (SAFE)
    ========================= */
    console.log(
      `📊 MonthlySummary | ${empId} | ${month}/${year} | ` +
      `P=${totalPresent}, A=${totalAbsent}, WO=${totalWO}, HO=${totalHO}, ` +
      `ALF=${totalALF}, ALH=${totalALH}, TOTAL=${finalTotalDays}`
    );

    await saveMonthlySummary(summary);
  }
};

module.exports = {
  regenerateMonthlySummaryForEmployee,
};