import React, { useEffect, useRef, useState } from "react";
import { __ } from "@wordpress/i18n";
import { Button, Icon, Modal } from "@wordpress/components";
import EditFieldModal from "./EditFieldModal";
import { EditFormFieldsProps } from "../../classes/components-props";
import { Field } from "../../classes/fields";
import { isNumberOfPeopleField } from "../../utils";

const EditFormFields = (props: EditFormFieldsProps) => {
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [fieldToDeleteIndex, setFieldToDeleteIndex] = useState(
    null as number | null,
  );
  const [fieldToEditIndex, setFieldToEditIndex] = useState(
    null as number | null,
  );
  const [fieldToEdit, setFieldToEdit] = useState(null as Field | null);
  const fieldToEditIndexRef = useRef(fieldToEditIndex);

  useEffect(() => {
    fieldToEditIndexRef.current = fieldToEditIndex;
  }, [fieldToEditIndex]);

  function openAddFieldModal() {
    setFieldToEditIndex(null);
    setFieldToEdit(null);
    setShowEditFieldModal(true);
  }

  function openEditFieldModal(fieldIndex: number) {
    setFieldToEditIndex(fieldIndex);
    setFieldToEdit(props.formFields[fieldIndex]);
    setShowEditFieldModal(true);
  }

  function saveField(field: Field) {
    const index = fieldToEditIndexRef.current;
    if (index === null) {
      props.setFormFields([...props.formFields, field]);
    } else {
      props.setFormFields(
        props.formFields.map((f, i) => (i === index ? field : f)),
      );
    }
    setFieldToEdit(null);
    setFieldToEditIndex(null);
  }

  function openDeleteFieldModal(fieldIndex: number) {
    setFieldToDeleteIndex(fieldIndex);
  }

  function closeDeleteFieldModal() {
    setFieldToDeleteIndex(null);
  }

  function confirmDeleteField() {
    props.setFormFields(
      props.formFields.filter((_, i) => i !== fieldToDeleteIndex),
    );
    setFieldToDeleteIndex(null);
  }

  function moveFieldUp(fieldIndex: number) {
    const oldFields = props.formFields;
    const newFields = [];
    for (let i = 0; i < oldFields.length; i++) {
      if (i < fieldIndex - 1 || i > fieldIndex) {
        newFields.push(oldFields[i]);
      } else if (i === fieldIndex - 1) {
        newFields.push(oldFields[fieldIndex]);
      } else {
        newFields.push(oldFields[fieldIndex - 1]);
      }
    }
    props.setFormFields(newFields);
  }

  function moveFieldDown(fieldIndex: number) {
    const oldFields = props.formFields;
    const newFields = [];
    for (let i = 0; i < oldFields.length; i++) {
      if (i < fieldIndex || i > fieldIndex + 1) {
        newFields.push(oldFields[i]);
      } else if (i === fieldIndex) {
        newFields.push(oldFields[fieldIndex + 1]);
      } else {
        newFields.push(oldFields[fieldIndex]);
      }
    }
    props.setFormFields(newFields);
  }

  function isFieldDeletable(field: Field) {
    return isNaN(field.id) || !isNumberOfPeopleField(field);
  }

  return (
    <>
      <h2>{__("Event form", "regi-fair")}</h2>
      {props.formFields.length === 0 && (
        <p>{__("Your form is empty. Add some fields.", "regi-fair")}</p>
      )}

      {props.formFields.length !== 0 && (
        <>
          <table className="widefat">
            <thead>
              <tr>
                <th>{__("Label", "regi-fair")}</th>
                <th>{__("Type", "regi-fair")}</th>
                <th>{__("Required", "regi-fair")}</th>
                <th>{__("Position", "regi-fair")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {props.formFields.map((f, index) => {
                return (
                  <tr key={index}>
                    <td>{f.label}</td>
                    <td>{f.fieldType}</td>
                    <td>
                      {f.required
                        ? __("Yes", "regi-fair")
                        : __("No", "regi-fair")}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                        aria-label={__("Move field up", "regi-fair")}
                      >
                        <Icon icon="arrow-up" />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => moveFieldDown(index)}
                        disabled={index === props.formFields.length - 1}
                        aria-label={__("Move field down", "regi-fair")}
                      >
                        <Icon icon="arrow-down" />
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        onClick={() => openEditFieldModal(index)}
                      >
                        Edit
                      </Button>
                      &nbsp;
                      {isFieldDeletable(f) && (
                        <Button
                          variant="primary"
                          onClick={() => openDeleteFieldModal(index)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <br />
        </>
      )}

      <Button onClick={openAddFieldModal} variant="primary">
        {__("Add form field", "regi-fair")}
      </Button>

      <EditFieldModal
        showNumberOfPeopleFieldButton={
          props.formFields.filter((f) => isNumberOfPeopleField(f)).length === 0
        }
        showPrivacyFieldButton={
          props.formFields.filter((f) => f.fieldType === "privacy").length === 0
        }
        showEditFieldModal={showEditFieldModal}
        setShowEditFieldModal={setShowEditFieldModal}
        fieldToEdit={fieldToEdit}
        setFieldToEdit={setFieldToEdit}
        saveField={saveField}
      />

      {fieldToDeleteIndex !== null && (
        <Modal
          title={__("Delete field", "regi-fair")}
          onRequestClose={closeDeleteFieldModal}
        >
          <p>
            {__("Do you really want to delete this field?", "regi-fair")}
          </p>
          <Button variant="primary" onClick={confirmDeleteField}>
            {__("Confirm", "regi-fair")}
          </Button>
          &nbsp;
          <Button variant="secondary" onClick={closeDeleteFieldModal}>
            {__("Cancel", "regi-fair")}
          </Button>
        </Modal>
      )}
    </>
  );
};

export default EditFormFields;
