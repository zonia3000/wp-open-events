import React, { useState, useEffect } from 'react';
import { Button, TextControl, CheckboxControl, BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import AddFieldModal from './AddFieldModal';
import Loading from '../../Loading';

const EditEvent = (props: any) => {

    const [eventData, setEventData] = useState(null);
    const [eventName, setEventName] = useState('');
    const [date, setDate] = useState((new Date()).toString());
    const [autoremove, setAutoremove] = useState(true);
    const [formFields, setFormFields] = useState([]);
    const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

    const [showAddFieldModal, setShowAddFieldModal] = useState(false);

    const openAddFieldModal = () => setShowAddFieldModal(true);

    useEffect(() => {
        if (props.currentEventId === null) {
            props.setLoading(false);
        } else if (eventData === null || props.currentEventId !== eventData.id) {
            props.setLoading(true);
            apiFetch({ path: '/wpoe/v1/events/' + props.currentEventId }).then((result) => {
                const event = result as EventConfiguration;
                setEventData(event);
                setEventName(event.name);
                setDate(event.date);
                setAutoremove(event.autoremove);
                setFormFields(event.formFields);
                setCurrentFieldIndex(event.formFields.length);
                props.setLoading(false);
            });
        }
    }, []);

    const save = () => {
        const event: EventConfiguration = {
            name: eventName,
            date: parseDate(),
            formFields,
            autoremove: autoremove,
            autoremovePeriod: 30
        };
        apiFetch({
            path: '/wpoe/v1/events',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });
    };

    function parseDate() {
        return new Date(date).toISOString().slice(0, 10);
    }

    const saveCurrentField = (field: Field) => {
        const newFields = formFields.map((f, i) => i === currentFieldIndex ? field : f);
        if (formFields.length <= currentFieldIndex) {
            newFields.push(field);
        }
        setFormFields(newFields);
        setCurrentFieldIndex(currentFieldIndex + 1);
    }

    if (props.loading) {
        return <Loading />;
    }

    return (
        <div>
            <h1>{__('Edit event', 'wp-open-events')}</h1>
            <TextControl
                label={__('Name', 'wp-open-events')}
                onChange={setEventName}
                value={eventName}
                required
            />
            <BaseControl label={__('Date', 'wp-open-events')} __nextHasNoMarginBottom={false} id='eventDate'>
                <input type='date' id='eventDate' className='components-text-control__input' required
                    value={date} onChange={e => setDate(e.target.value)} />
            </BaseControl>

            <h2>{__('Event form', 'wp-open-events')}</h2>
            {formFields.length === 0 && <p>{__('Your form is empty. Add some fields.', 'wp-open-events')}</p>}

            {formFields.length !== 0 && <>
                <table className='widefat'>
                    <thead>
                        <tr>
                            <th>{__('Label', 'wp-open-events')}</th>
                            <th>{__('Type', 'wp-open-events')}</th>
                            <th>{__('Required', 'wp-open-events')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formFields.map(f => {
                            return (<tr>
                                <td>{f.label}</td>
                                <td>{f.fieldType}</td>
                                <td>{f.required ? __('Yes', 'wp-open-events') : __('No', 'wp-open-events')}</td>
                            </tr>)
                        })}
                    </tbody>
                </table>
                <br />
            </>}

            <Button onClick={openAddFieldModal} variant='primary'>
                {__('Add form field', 'wp-open-events')}
            </Button>

            <br /><br />
            <CheckboxControl
                label={__('Autoremove user data after the event', 'wp-open-events')}
                checked={autoremove}
                onChange={setAutoremove}
            />

            <br /><hr />

            <Button onClick={save} variant='primary'>
                {__('Save', 'wp-open-events')}
            </Button>
            &nbsp;
            <Button onClick={props.toggleEditing} variant='secondary'>
                {__('Back', 'wp-open-events')}
            </Button>

            <AddFieldModal
                showAddFieldModal={showAddFieldModal}
                setShowAddFieldModal={setShowAddFieldModal}
                saveCurrentField={saveCurrentField} />
        </div>
    );
}

export default EditEvent;