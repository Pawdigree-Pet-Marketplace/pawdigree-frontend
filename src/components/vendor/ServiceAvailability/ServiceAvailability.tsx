import { useEffect, useState } from "react";
import { Plus, Trash2, Clock3 } from "lucide-react";
import API_BASE_URL from "../../../services/api";
import { vendorAuthenticatedFetch } from "../../../services/vendorAuthenticatedFetch";
import "./ServiceAvailability.css";

type TimeSlot = {
  id: number;
  startTime: string;
  endTime: string;
};

type DayAvailability = {
  weekday: number;
  name: string;
  slots: TimeSlot[];
};

type ApiSlot = {
  slot_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
};

type ApiDay = {
  weekday: number;
  day: string;
  slots: ApiSlot[];
};

type AvailabilityResponse = {
  service_id: number;
  service_name: string;
  duration: number;
  availability_status: string;
  days: ApiDay[];
};

const initialDays: DayAvailability[] = [
  { weekday: 0, name: "Monday", slots: [] },
  { weekday: 1, name: "Tuesday", slots: [] },
  { weekday: 2, name: "Wednesday", slots: [] },
  { weekday: 3, name: "Thursday", slots: [] },
  { weekday: 4, name: "Friday", slots: [] },
  { weekday: 5, name: "Saturday", slots: [] },
  { weekday: 6, name: "Sunday", slots: [] },
];

type ServiceAvailabilityProps = {
  serviceId: string;
};

export default function ServiceAvailability({
  serviceId,
}: ServiceAvailabilityProps) {
const [days, setDays] = useState<DayAvailability[]>(initialDays);
const [selectedDay, setSelectedDay] = useState(0);
const [startTime, setStartTime] = useState("09:00");
const [endTime, setEndTime] = useState("17:00");
const [error, setError] = useState("");
const [loading, setLoading] = useState(true);
const [serviceName, setServiceName] = useState("");
const [serviceDuration, setServiceDuration] = useState(0);
  const currentDay = days[selectedDay];

  useEffect(() => {
  async function loadAvailability() {
    try {
      setLoading(true);
      setError("");

      const response = await vendorAuthenticatedFetch(
        `${API_BASE_URL}/api/services/${serviceId}/availability/`,
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load availability. Server returned ${response.status}.`,
        );
      }

      const data: AvailabilityResponse = await response.json();

      setServiceName(data.service_name);
      setServiceDuration(data.duration);

      const formattedDays: DayAvailability[] = data.days.map((day) => ({
        weekday: day.weekday,
        name: day.day,
        slots: day.slots.map((slot) => ({
          id: slot.slot_id,
          startTime: slot.start_time.slice(0, 5),
          endTime: slot.end_time.slice(0, 5),
        })),
      }));

      setDays(formattedDays);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading availability.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (serviceId) {
    loadAvailability();
  }
}, [serviceId]);

  async function addTimeSlot() {
  setError("");

  if (!startTime || !endTime) {
    setError("Please enter both start and end times.");
    return;
  }

  if (endTime <= startTime) {
    setError("End time must be later than start time.");
    return;
  }

  const overlaps = currentDay.slots.some(
    (slot) => startTime < slot.endTime && endTime > slot.startTime,
  );

  if (overlaps) {
    setError("This time slot overlaps with an existing slot.");
    return;
  }

  try {
    const response = await vendorAuthenticatedFetch(
      `${API_BASE_URL}/api/services/${serviceId}/slots/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekday: selectedDay,
          start_time: startTime,
          end_time: endTime,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data
        ? Object.entries(data)
            .map(([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`,
            )
            .join("\n")
        : "Unable to add this time slot.";

      throw new Error(message);
    }

    const newSlot: TimeSlot = {
      id: data.slot_id,
      startTime: data.start_time.slice(0, 5),
      endTime: data.end_time.slice(0, 5),
    };

    setDays((previousDays) =>
      previousDays.map((day) =>
        day.weekday === selectedDay
          ? {
              ...day,
              slots: [...day.slots, newSlot].sort((a, b) =>
                a.startTime.localeCompare(b.startTime),
              ),
            }
          : day,
      ),
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong while adding the time slot.",
    );
  }
}

  async function removeTimeSlot(slotId: number) {
  setError("");

  try {
    const response = await vendorAuthenticatedFetch(
      `${API_BASE_URL}/api/services/${serviceId}/slots/${slotId}/`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      throw new Error(
        data
          ? JSON.stringify(data)
          : `Unable to remove time slot. Server returned ${response.status}.`,
      );
    }

    setDays((previousDays) =>
      previousDays.map((day) =>
        day.weekday === selectedDay
          ? {
              ...day,
              slots: day.slots.filter((slot) => slot.id !== slotId),
            }
          : day,
      ),
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong while removing the time slot.",
    );
  }
}

  return (
    <div className="service-availability">
     {loading && <p>Loading service availability...</p>}
      <div className="availability-intro">
        <div>
          <h2>{serviceName || "Weekly availability"}</h2>
    <p>
       Choose the days and times when customers can book this service.
      </p>
       {serviceDuration > 0 && (
     <p>Minimum time slot duration: {serviceDuration} minutes</p>
   )}
        </div>
        <Clock3 size={24} />
      </div>

      <div className="availability-days">
        {days.map((day) => (
          <button
            key={day.weekday}
            type="button"
            className={`availability-day ${
              selectedDay === day.weekday ? "selected" : ""
            }`}
            onClick={() => {
              setSelectedDay(day.weekday);
              setError("");
            }}
          >
            <span>{day.name.slice(0, 3)}</span>
            <small>{day.slots.length} slots</small>
          </button>
        ))}
      </div>

      <section className="availability-day-content">
        <h3>{currentDay.name}</h3>

        {currentDay.slots.length === 0 ? (
          <p className="availability-empty">
            No time slots added for this day yet.
          </p>
        ) : (
          <div className="availability-slot-list">
            {currentDay.slots.map((slot) => (
              <div className="availability-slot" key={slot.id}>
                <span>
                  {slot.startTime} – {slot.endTime}
                </span>

                <button
                  type="button"
                  aria-label={`Remove ${slot.startTime} to ${slot.endTime}`}
                  onClick={() => removeTimeSlot(slot.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="availability-add-slot">
          <h4>Add a time slot</h4>

          <div className="availability-time-fields">
            <label>
              Start time
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label>
              End time
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="availability-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="availability-add-button"
            onClick={addTimeSlot}
          >
            <Plus size={18} />
            Add time slot
          </button>
        </div>
      </section>
    </div>
  );
}