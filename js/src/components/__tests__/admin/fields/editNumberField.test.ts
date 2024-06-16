import { editEventTest } from "../../__base__/editEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

editEventTest('Unset number field min and max', {
  "name": "test",
  "date": "2050-01-01",
  "formFields":
    [{
      "id": 1,
      "label": "Number field",
      "fieldType": "number",
      "required": true,
      "extra": { "min": 5, "max": 10 }
    }]
}, async () => {
  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);
  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Number field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  expect((screen.getByRole('spinbutton', { name: 'Minimum value (optional)' }) as HTMLInputElement).value).toEqual('5');
  expect((screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }) as HTMLInputElement).value).toEqual('10');

  await userEvent.clear(screen.getByRole('spinbutton', { name: 'Minimum value (optional)' }));
  await userEvent.clear(screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }));

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra).toEqual({});
  expect(requestBody.formFields[0].required).toEqual(true);
});