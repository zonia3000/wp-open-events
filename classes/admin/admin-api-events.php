<?php

require_once (WPOE_PLUGIN_DIR . 'classes/model/event.php');
require_once (WPOE_PLUGIN_DIR . 'classes/model/form-field.php');
require_once (WPOE_PLUGIN_DIR . 'classes/dao/dao-events.php');
require_once (WPOE_PLUGIN_DIR . 'classes/api-utils.php');

class WPOE_Events_Admin_Controller extends WP_REST_Controller
{
    public function register_routes()
    {
        $namespace = 'wpoe/v1';

        register_rest_route(
            $namespace,
            '/admin/events',
            [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'permission_callback' => 'is_events_admin',
                    'callback' => [$this, 'get_items']
                ],
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'permission_callback' => 'is_events_admin',
                    'callback' => [$this, 'create_item'],
                    'args' => $this->get_endpoint_args_for_item_schema()
                ],
                'schema' => [$this, 'get_item_schema']
            ]
        );

        register_rest_route(
            $namespace,
            '/admin/events/(?P<id>\d+)',
            [
                'args' => [
                    'id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]
                ],
                [
                    'methods' => WP_REST_Server::READABLE,
                    'permission_callback' => 'is_events_admin',
                    'callback' => [$this, 'get_item']
                ],
                [
                    'methods' => WP_REST_Server::EDITABLE,
                    'permission_callback' => 'is_events_admin',
                    'callback' => [$this, 'update_item'],
                    'args' => array_merge(
                        $this->get_endpoint_args_for_item_schema(),
                        ['properties' => ['id' => ['type' => 'integer', 'required' => true, 'minimum' => 1]]]
                    )
                ],
                [
                    'methods' => WP_REST_Server::DELETABLE,
                    'permission_callback' => 'is_events_admin',
                    'callback' => [$this, 'delete_item']
                ],
                'schema' => [$this, 'get_item_schema']
            ]
        );
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function get_items($request)
    {
        try {
            return new WP_REST_Response(WPOE_DAO_Events::list_events());
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function get_item($request)
    {
        try {
            $id = (int) $request->get_param('id');
            $event = WPOE_DAO_Events::get_event($id);
            if ($event === null) {
                return new WP_Error('event_not_found', __('Event not found', 'wp-open-events'), ['status' => 404]);
            }
            return new WP_REST_Response($event);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function create_item($request)
    {
        try {
            $event = new Event;
            $event->name = $request->get_param('name');
            $event->date = $request->get_param('date');
            $event->autoremove = (bool) $request->get_param('autoremove');
            $event->autoremovePeriod = (int) $request->get_param('autoremovePeriod');
            $event->formFields = (array) $request->get_param('formFields');
            $event_id = WPOE_DAO_Events::create_event($event);
            return new WP_REST_Response(['id' => $event_id]);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    /**
     * @param WP_REST_Request $request
     * @return WP_Error|WP_REST_Response
     */
    public function delete_item($request)
    {
        try {
            $id = (int) $request->get_param('id');
            WPOE_DAO_Events::delete_event($id);
            return new WP_REST_Response(null, 204);
        } catch (Exception $ex) {
            return generic_server_error($ex);
        }
    }

    public function get_item_schema()
    {
        // Returned cached copy whenever available.
        if ($this->schema) {
            return $this->add_additional_fields_schema($this->schema);
        }

        $schema = parent::get_item_schema();

        $schema['properties']['name'] = ['type' => 'string', 'required' => true];
        $schema['properties']['date'] = ['type' => 'string', 'required' => true, 'format' => 'date'];
        $schema['properties']['autoremove'] = ['type' => 'boolean', 'required' => true];
        $schema['properties']['autoremovePeriod'] = ['type' => 'integer', 'required' => true, 'minimum' => 1];
        $schema['properties']['waitingList'] = ['type' => 'boolean', 'required' => true];
        $schema['properties']['formFields'] = get_form_fields_schema();

        // Cache generated schema on endpoint instance.
        $this->schema = $schema;

        return $this->add_additional_fields_schema($this->schema);
    }
}