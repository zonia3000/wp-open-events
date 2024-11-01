import { editEventTest } from "../../__base__/editEvent.setup";
import { expect } from "vitest";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";

editEventTest(
  "Unset number field min and max",
  {
    id: 1,
    name: "test",
    date: "2050-01-01",
    formFields: [
      {
        id: 1,
        label: "Number field",
        fieldType: "number",
        required: true,
        extra: { min: 5, max: 10 },
      },
    ],
    autoremove: true,
    autoremovePeriod: 30,
    ended: false,
    editableRegistrations: false,
    waitingList: false,
    maxParticipants: null,
    adminEmail: null,
    extraEmailContent: null,
  },
  async () => {
    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);
    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Number field");
    expect(cells[1].textContent).toEqual("number");
    expect(cells[2].textContent).toEqual("Yes");

    const user = userEvent.setup();

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Number field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("");
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();
    expect(
      screen.getByRole("spinbutton", { name: "Minimum value (optional)" }),
    ).toHaveValue(5);
    expect(
      screen.getByRole("spinbutton", { name: "Maximum value (optional)" }),
    ).toHaveValue(10);

    await user.clear(
      screen.getByRole("spinbutton", { name: "Minimum value (optional)" }),
    );
    await user.clear(
      screen.getByRole("spinbutton", { name: "Maximum value (optional)" }),
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("number");
    expect(requestBody.formFields[0].label).toEqual("Number field");
    expect(requestBody.formFields[0].description).toEqual(undefined);
    expect(requestBody.formFields[0].extra).toEqual({});
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);
