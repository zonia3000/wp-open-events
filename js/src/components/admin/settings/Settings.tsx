import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Settings as SettingsOptions } from '../../classes/settings';
import apiFetch from '@wordpress/api-fetch';
import { extractError } from '../../utils';
import Loading from '../../Loading';
import { Button, CheckboxControl, Notice, Spinner, TextControl, TextareaControl } from '@wordpress/components';
import '../../style.css';

const Settings = function () {

    const [loading, setLoading] = useState(true);
    const [defaultAdminEmail, setDefaultAdminEmail] = useState('');
    const [defaultAutoremovePeriod, setDefaultAutoremovePeriod] = useState('30');
    const [defaultExtraEmailContent, setDefaultExtraEmailContent] = useState('');
    const [defaultTrackIpAddresses, setDefaultTrackIpAddresses] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        apiFetch({ path: `/wpoe/v1/admin/settings` })
            .then((result) => {
                const settings = result as SettingsOptions;
                setDefaultAdminEmail(settings.defaultAdminEmail);
                setDefaultAutoremovePeriod(settings.defaultAutoremovePeriod.toString());
                setDefaultExtraEmailContent(settings.defaultExtraEmailContent);
                setDefaultTrackIpAddresses(settings.defaultTrackIpAddresses);
            })
            .catch(err => {
                setError(extractError(err));
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function save() {
        setSaving(true);
        setError('');
        try {
            await apiFetch({
                path: `/wpoe/v1/admin/settings`,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    defaultAdminEmail,
                    defaultAutoremovePeriod: Number(defaultAutoremovePeriod),
                    defaultExtraEmailContent,
                    defaultTrackIpAddresses
                })
            });
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className='wrap'>
            <h1>Settings</h1>
            <p><em>{__('All the following options are just defaults and they can be redefined for each event', 'wp-open-events')}</em></p>
            <TextControl
                label={__('Default event admin e-mail address', 'wp-open-events')}
                onChange={setDefaultAdminEmail}
                value={defaultAdminEmail}
                type='email'
                help={__('Received registrations will be notified at this addres', 'wp-open-events')}
            />

            <TextControl
                label={__('Default autoremove period', 'wp-open-events')}
                onChange={setDefaultAutoremovePeriod}
                value={defaultAutoremovePeriod}
                type='number'
                help={__('Number of days to wait after the event conclusion before removing registrations data', 'wp-open-events')}
            />

            <TextareaControl
                label={__('Default extra content for confirmation e-mail messages', 'wp-open-events')}
                onChange={setDefaultExtraEmailContent}
                value={defaultExtraEmailContent}
                help={__('This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>', 'wp-open-events')}
            />

            <CheckboxControl
                label={__('Track IP addresses during the registration', 'wp-open-events')}
                onChange={setDefaultTrackIpAddresses}
                checked={defaultTrackIpAddresses}
            />

            {error && <div className='mb'><Notice status='error'>{error}</Notice></div>}

            <Button onClick={save} variant='primary' disabled={saving} className='mt'>
                {saving && <Spinner />}
                {__('Save', 'wp-open-events')}
            </Button>
        </div>
    );
}

export default Settings;
