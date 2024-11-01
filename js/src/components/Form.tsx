import React, { useState, useEffect } from "react";
import { FormProps } from "./classes/components-props";
import apiFetch from "@wordpress/api-fetch";
import Loading from "./Loading";
import { Button, Modal, Notice } from "@wordpress/components";
import { __, _nx, sprintf } from "@wordpress/i18n";
import {
  checkErrorCode,
  extactFieldErrors,
  extractError,
  getDefaultFieldValue,
} from "./utils";
import "./style.css";
import FormFields from "./FormFields";
import { EventConfiguration } from "./classes/event";
import { Registration } from "./classes/registration";

const Form = (props: FormProps) => {
  const [event, setEvent] = useState(null as EventConfiguration);
  const [found, setFound] = useState(false);
  const [fields, setFields] = useState(
    {} as Record<number, string | string[] | boolean>,
  );
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldsErrors, setFieldsErrors] = useState(
    {} as Record<number, string>,
  );
  const [registrationToken, setRegistrationToken] = useState("");
  const [editingExisting, setEditingExisting] = useState(false);
  const [
    showConfirmDeleteRegistrationModal,
    setShowConfirmDeleteRegistrationModal,
  ] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(null as number | null);
  const [waitingList, setWaitingList] = useState(false);
  const [lastSeatTaken, setLastSeatTaken] = useState(false);

  useEffect(() => {
    props.setLoading(true);
    loadEventData().finally(() => {
      props.setLoading(false);
    });
    window.addEventListener("hashchange", loadEventData);
    return () => {
      window.removeEventListener("hashchange", loadEventData);
    };
  }, []);

  async function loadEventData() {
    let eventConfig: EventConfiguration | null = null;
    try {
      eventConfig = await apiFetch({
        path: `/regifair/v1/events/${props.eventId}`,
      });
      setFound(true);
      setEvent(eventConfig);
      setFields(
        Object.fromEntries(
          eventConfig.formFields.map((f) => [f.id, getDefaultFieldValue(f)]),
        ),
      );
      if (!isNaN(eventConfig.availableSeats)) {
        setAvailableSeats(eventConfig.availableSeats);
      }
    } catch (err) {
      if (checkErrorCode(err, "event_not_found")) {
        setFound(false);
      } else {
        setError(extractError(err));
      }
    }
    if (eventConfig === null || !eventConfig.editableRegistrations) {
      return;
    }
    await loadExistingRegistration();
  }

  async function loadExistingRegistration() {
    const hash = window.location.hash;
    const match = hash.match(/registration=(.*)/);
    if (!match || match.length !== 2) {
      return;
    }
    const token = match[1];
    try {
      const registration: Registration = await apiFetch({
        path: `/regifair/v1/events/${props.eventId}/${token}`,
      });
      setRegistrationToken(token);
      setFields(registration.values);
      setWaitingList(registration.waitingList);
      setEditingExisting(true);
    } catch {
      console.warn("Unable to retrieve registration");
    }
  }

  async function submitForm() {
    setError("");
    setDeletionError("");
    setFieldsErrors({});
    setSubmitted(false);
    setSubmitting(true);
    setDeleted(false);
    try {
      let result: { remaining: null | number };
      if (editingExisting) {
        result = await apiFetch({
          path: `/regifair/v1/events/${props.eventId}/${registrationToken}`,
          method: "PUT",
          data: fields,
        });
      } else {
        const waiting =
          waitingList ||
          (availableSeats !== null && availableSeats <= 0 && event.waitingList);
        result = await apiFetch({
          path: `/regifair/v1/events/${props.eventId}?waitingList=${waiting}`,
          method: "POST",
          data: fields,
        });
        // reset field values
        setFields(
          Object.fromEntries(Object.entries(fields).map((f) => [f[0], ""])),
        );
      }
      if (result.remaining !== null) {
        setAvailableSeats(result.remaining);
        if (result.remaining <= 0) {
          setLastSeatTaken(true);
        }
      }
      setSubmitted(true);
    } catch (err) {
      setFieldsErrors(extactFieldErrors(err));
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRegistration() {
    setError("");
    setDeletionError("");
    setFieldsErrors({});
    setDeleted(false);
    setSubmitted(false);
    try {
      const result: { remaining: null | number } = await apiFetch({
        path: `/regifair/v1/events/${props.eventId}/${registrationToken}`,
        method: "DELETE",
      });
      // reset registration token on URL
      window.location.hash = "";
      // reset field values
      setFields(
        Object.fromEntries(Object.entries(fields).map((f) => [f[0], ""])),
      );
      setDeleted(true);
      setShowConfirmDeleteRegistrationModal(false);
      setEditingExisting(false);
      if (result.remaining !== null) {
        setAvailableSeats(result.remaining);
      }
    } catch (err) {
      setDeletionError(extractError(err));
    }
  }

  if (props.loading) {
    return <Loading />;
  }

  if (!found) {
    if (props.admin) {
      return <p>{__("Event not found", "regi-fair")}</p>;
    } else {
      // Show nothing in public posts
      return;
    }
  }

  if (event.ended) {
    return (
      <Notice status="info" className="mb-2" isDismissible={false}>
        {__("Event is ended", "regi-fair")}
      </Notice>
    );
  }

  return (
    <>
      {editingExisting && (
        <Notice status="info" className="mb-2" isDismissible={false}>
          {__(
            "Welcome back. You are editing an existing registration.",
            "regi-fair",
          )}
        </Notice>
      )}

      {availableSeats !== null && availableSeats > 0 && (
        <Notice status="info" isDismissible={false}>
          {sprintf(
            _nx(
              "There is still one seat available.",
              "There are still %d seats available.",
              availableSeats,
              "number of available seats",
              "regi-fair",
            ),
            availableSeats,
          )}
        </Notice>
      )}

      {availableSeats !== null && availableSeats <= 0 && editingExisting && (
        <Notice status="info" isDismissible={false}>
          {__("There are no more seats available.", "regi-fair")}
          {waitingList &&
            " " +
              __("This registration is in the waiting list.", "regi-fair")}
        </Notice>
      )}

      {availableSeats !== null && availableSeats <= 0 && !editingExisting && (
        <Notice status="info" isDismissible={false}>
          {event.waitingList
            ? __(
                "There are no more seats available. You can only join the waiting list. You will be notified when new seats will be available.",
                "regi-fair",
              )
            : lastSeatTaken
            ? __(
                "Congratulation! You took the last seat available!",
                "regi-fair",
              )
            : __(
                "We are sorry. You can't register because there are no more seats available.",
                "regi-fair",
              )}
        </Notice>
      )}

      {(editingExisting ||
        availableSeats === null ||
        availableSeats > 0 ||
        event.waitingList) && (
        <FormFields
          formFields={event.formFields}
          fieldsValues={fields}
          setFieldsValues={setFields}
          disabled={props.disabled}
          fieldsErrors={fieldsErrors}
        />
      )}

      {error && (
        <Notice status="error" className="mt-2 mb-2" isDismissible={false}>
          {error}
        </Notice>
      )}

      {(editingExisting ||
        availableSeats === null ||
        availableSeats > 0 ||
        event.waitingList) && (
        <>
          {submitted && (
            <Notice
              status="success"
              className="mt-2 mb-2"
              isDismissible={false}
            >
              {editingExisting
                ? __("Your registration has been updated", "regi-fair")
                : __("Your registration has been submitted", "regi-fair")}
            </Notice>
          )}

          {deleted && (
            <Notice
              status="success"
              className="mt-2 mb-2"
              isDismissible={false}
            >
              {__("Your registration has been deleted", "regi-fair")}
            </Notice>
          )}

          <Button
            variant="primary"
            className="mt"
            onClick={submitForm}
            disabled={props.disabled || submitting}
          >
            {editingExisting
              ? __("Update the registration", "regi-fair")
              : availableSeats === null || availableSeats > 0
              ? __("Register to the event", "regi-fair")
              : __("Join the waiting list", "regi-fair")}
          </Button>

          {editingExisting && (
            <Button
              variant="secondary"
              className="ml mt"
              onClick={() => setShowConfirmDeleteRegistrationModal(true)}
              disabled={props.disabled}
            >
              {__("Delete the registration", "regi-fair")}
            </Button>
          )}

          {showConfirmDeleteRegistrationModal && (
            <Modal
              title={__("Confirm registration deletion", "regi-fair")}
              onRequestClose={() =>
                setShowConfirmDeleteRegistrationModal(false)
              }
            >
              <p>
                {__(
                  "Do you really want to delete the registration to this event?",
                  "regi-fair",
                )}
              </p>
              {deletionError && (
                <Notice
                  status="error"
                  className="mt-2 mb-2"
                  isDismissible={false}
                >
                  {deletionError}
                </Notice>
              )}
              <Button variant="primary" onClick={deleteRegistration}>
                {__("Confirm", "regi-fair")}
              </Button>
            </Modal>
          )}
        </>
      )}
    </>
  );
};

export default Form;
