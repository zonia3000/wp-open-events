import React, { useEffect, useState } from 'react';
import { Button, CheckboxControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EditRadioFieldProps } from '../../classes/components-props';
import '../../style.css';

const EditRadioField = (props: EditRadioFieldProps) => {

    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [options, setOptions] = useState(['', '']);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        props.setField({
            label: '',
            fieldType: 'radio',
            required: false,
            description: '',
            options: ['', ''],
            validate() {
                setValidated(true);
                return fieldLabel !== '' && options.filter(o => o.trim() === '').length === 0;
            }
        });
    }, []);

    function saveFieldLabel(value: string) {
        setFieldLabel(value);
        props.setField({
            ...props.field,
            label: value
        });
    }

    function saveFieldDescription(value: string) {
        setFieldDescription(value);
        props.setField({
            ...props.field,
            description: value
        });
    }

    function saveFieldRequired(value: boolean) {
        setFieldRequired(value);
        props.setField({
            ...props.field,
            required: value
        });
    }

    function addOption() {
        setOptions([...options, '']);
    }

    function removeOption(index: number) {
        setOptions(options.filter((_, i) => i !== index));
    }

    function saveFieldOptions(value: string, index: number) {
        setOptions(options.map((o, i) => i === index ? value : o));
        props.setField({
            ...props.field,
            options
        });
    }

    const optionsList = options.map((option, index) => {
        return (
            <div className={validated && option.trim() === '' ? 'form-error edit-radio-option-wrapper' : 'edit-radio-option-wrapper'} key={index}>
                <TextControl
                    label={__('Option', 'wp-open-events') + ' ' + (index + 1)}
                    onChange={value => saveFieldOptions(value, index)}
                    value={option}
                    required
                />
                {options.length > 2 &&
                    <Button aria-label={__('Remove option', 'wp-open-events')} onClick={() => removeOption(index)} className='remove-option-btn'>
                        &times;
                    </Button>
                }
                <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
            </div>);
    });

    return (
        <>
            <div className={validated && fieldLabel.trim() === '' ? 'form-error' : ''}>
                <TextControl
                    label={__('Label', 'wp-open-events')}
                    onChange={saveFieldLabel}
                    value={fieldLabel}
                    required
                />
                <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
            </div>
            <TextControl
                label={__('Description', 'wp-open-events')}
                onChange={saveFieldDescription}
                value={fieldDescription}
                required
            />
            <CheckboxControl
                label={__('Required', 'wp-open-events')}
                checked={fieldRequired}
                onChange={saveFieldRequired}
                className={'mt-2 mb-2'}
            />
            {optionsList}
            <Button onClick={addOption} variant='primary'>
                {__('Add option', 'wp-open-events')}
            </Button>
            <br />
        </>
    );
}

export default EditRadioField;