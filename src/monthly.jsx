import React, { useMemo, useState } from "react";

const API_BASE =
  "https://attendance-backend-hs75.onrender.com/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatAttendanceDate = (date) => {
  return date.toLocaleDateString("en-IN");
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const monthLabel = (year, month) => {
  return new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getRecordLabel = (record, date, today, holidayName) => {
  if (holidayName && !record) {
    return "Holiday";
  }

  if (!record) {
    if (date.getTime() > today.getTime()) {
      return "";
    }

    if (date.getTime() === today.getTime()) {
      return "Not marked";
    }

    return "Absent";
  }

  if (record.status === "Punched In") {
    return "Punched In";
  }

  if (record.flags?.isHalfDay) {
    return "Half Day";
  }

  if (record.flags?.isLate) {
    return "Late";
  }

  return "Present";
};

function MonthlyAttendance({ onBack }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [mobileNumber, setMobileNumber] = useState("");
  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const loadAttendance = async (number, monthView) => {
    const activeView = monthView || view;
    const monthKey = `${activeView.year}-${String(
      activeView.month + 1
    ).padStart(2, "0")}`;

    const [attendanceResponse, holidayResponse] =
      await Promise.all([
        fetch(
          `${API_BASE}/attendance/employee/${number}`
        ),
        fetch(
          `${API_BASE}/holidays?month=${monthKey}`
        ),
      ]);

    const attendanceData =
      await attendanceResponse.json();

    if (!attendanceResponse.ok) {
      throw new Error(
        attendanceData.message ||
          "Unable to load monthly attendance."
      );
    }

    setRecords(
      Array.isArray(attendanceData.data)
        ? attendanceData.data
        : []
    );

    if (holidayResponse.ok) {
      const holidayData = await holidayResponse.json();
      setHolidays(
        Array.isArray(holidayData.data)
          ? holidayData.data
          : []
      );
    } else {
      setHolidays([]);
    }
  };

  const loadMonth = async (number) => {
    setLoading(true);
    setError("");
    setEmployee(null);
    setRecords([]);
    setHolidays([]);

    try {
      const employeesResponse = await fetch(
        `${API_BASE}/employees`
      );
      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        throw new Error(
          employeesData.message ||
            "Unable to verify employee."
        );
      }

      const matchedEmployee = (
        Array.isArray(employeesData.data)
          ? employeesData.data
          : []
      ).find(
        (item) =>
          String(item.mobileNumber) === String(number)
      );

      if (!matchedEmployee) {
        setEmployee({ registered: false });
        setError(
          "This mobile number is not registered."
        );
        return;
      }

      const access =
        matchedEmployee.monthlyAttendanceAccess ||
        "disabled";

      setEmployee({
        registered: true,
        name: matchedEmployee.name,
        mobileNumber: matchedEmployee.mobileNumber,
        access,
      });

      if (access === "enabled") {
        await loadAttendance(number);
      }
    } catch (loadError) {
      setError(
        loadError.message ||
          "Unable to load monthly attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  const raiseRequest = async () => {
    if (mobileNumber.length !== 10 || requesting) {
      return;
    }

    try {
      setRequesting(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/employees/monthly-access/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobileNumber,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to raise the request."
        );
      }

      const access =
        data.data?.monthlyAttendanceAccess ||
        "requested";

      setEmployee((current) => ({
        ...current,
        access,
      }));

      if (access === "enabled") {
        await loadAttendance(mobileNumber);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to raise the request."
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleMobileChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setMobileNumber(value);
    setEmployee(null);
    setRecords([]);
    setHolidays([]);
    setError("");

    if (value.length === 10) {
      loadMonth(value);
    }
  };

  const changeMonth = (step) => {
    const next = new Date(view.year, view.month + step, 1);
    const current = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (next > current) {
      return;
    }

    const nextView = {
      year: next.getFullYear(),
      month: next.getMonth(),
    };

    setView(nextView);

    if (
      mobileNumber.length === 10 &&
      employee?.access === "enabled"
    ) {
      loadAttendance(mobileNumber, nextView).catch(
        () => {
          setHolidays([]);
        }
      );
    }
  };

  const days = useMemo(() => {
    const recordByDate = new Map(
      records.map((record) => [record.date, record])
    );
    const holidayByDate = new Map(
      holidays.map((holiday) => [
        holiday.date,
        holiday.name || holiday.title || "Holiday",
      ])
    );

    const totalDays = new Date(
      view.year,
      view.month + 1,
      0
    ).getDate();

    return Array.from({ length: totalDays }, (_, index) => {
      const date = startOfDay(
        new Date(view.year, view.month, index + 1)
      );
      const record =
        recordByDate.get(formatAttendanceDate(date)) || null;
      const holidayName =
        holidayByDate.get(toIsoDate(date)) || "";
      const label = getRecordLabel(
        record,
        date,
        today,
        holidayName
      );

      return {
        date,
        record,
        holidayName,
        label,
      };
    });
  }, [records, holidays, view, today]);

  const summary = days.reduce(
    (counts, day) => {
      if (day.label === "Present") {
        counts.present += 1;
      }
      if (day.label === "Late") {
        counts.late += 1;
      }
      if (day.label === "Half Day") {
        counts.halfDay += 1;
      }
      if (day.label === "Absent") {
        counts.absent += 1;
      }
      if (day.label === "Punched In") {
        counts.open += 1;
      }
      return counts;
    },
    {
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      open: 0,
    }
  );

  const canGoNext =
    new Date(view.year, view.month, 1) <
    new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <section className="attendance-card monthly-card">
      <div className="card-header">
        <button
          type="button"
          className="header-back"
          onClick={onBack}
        >
          ←
        </button>
        <div>
          <h2>Show monthly attendance</h2>
          <p>
            Enter your mobile number. Admin must
            enable your monthly attendance.
          </p>
        </div>
      </div>

      <label htmlFor="monthlyMobile">
        Mobile Number
      </label>
      <div className="mobile-input-wrapper">
        <span className="country-code">+91</span>
        <input
          id="monthlyMobile"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter 10 digit mobile number"
          value={mobileNumber}
          onChange={handleMobileChange}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="loading-box monthly-loading">
          <div className="spinner small"></div>
          <p>Loading attendance...</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>{error}</strong>
        </div>
      )}

      {employee?.registered && !loading && (
        <>
          <div className="monthly-employee">
            <strong>{employee.name}</strong>
            <span>{employee.mobileNumber}</span>
          </div>

          {employee.access !== "enabled" && (
            <div className="monthly-request">
              <strong>
                {employee.access === "requested"
                  ? "Request sent"
                  : "Ask admin to enable"}
              </strong>
              <p>
                {employee.access === "requested"
                  ? "Waiting for admin to enable your monthly attendance."
                  : "You can see this month only after admin enables it for you."}
              </p>
              <button
                type="button"
                className="submit-button"
                onClick={raiseRequest}
                disabled={
                  requesting ||
                  employee.access === "requested"
                }
              >
                {employee.access === "requested"
                  ? "Request pending"
                  : requesting
                    ? "Sending request..."
                    : "Raise request"}
              </button>
            </div>
          )}

          {employee.access === "enabled" && (
          <>

          <div className="month-switcher">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>
            <strong>
              {monthLabel(view.year, view.month)}
            </strong>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={!canGoNext}
            >
              ›
            </button>
          </div>

          <div className="monthly-summary">
            <span>Present {summary.present}</span>
            <span>Late {summary.late}</span>
            <span>Half day {summary.halfDay}</span>
            <span>Absent {summary.absent}</span>
          </div>

          <div className="month-grid">
            {WEEKDAYS.map((day) => (
              <div key={day} className="month-weekday">
                {day}
              </div>
            ))}
            {Array.from({
              length: new Date(
                view.year,
                view.month,
                1
              ).getDay(),
            }).map((_, index) => (
              <div
                key={`blank-${index}`}
                className="month-blank"
              />
            ))}
            {days.map((day) => (
              <div
                key={day.date.toISOString()}
                className={`month-day status-${(
                  day.label || "empty"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <strong>{day.date.getDate()}</strong>
                <small>{day.label || ""}</small>
              </div>
            ))}
          </div>

          <div className="month-list">
            {days
              .filter((day) => day.label)
              .map((day) => (
                <div
                  key={`row-${day.date.toISOString()}`}
                  className="month-row"
                >
                  <div>
                    <strong>
                      {formatAttendanceDate(day.date)}
                    </strong>
                    <small>
                      {day.holidayName || day.label}
                    </small>
                  </div>
                  <div className="month-times">
                    <span>
                      In {formatTime(day.record?.punchIn?.timestamp)}
                    </span>
                    <span>
                      Out {formatTime(day.record?.punchOut?.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          </>
          )}
        </>
      )}
    </section>
  );
}

export default MonthlyAttendance;
