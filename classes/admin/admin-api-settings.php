<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/admin/settings-manager.php');

class WPOE_Settings_Admin_Controller extends WP_REST_Controller
{
  public function register_routes()
  {
    $namespace = 'wpoe/v1';

    register_rest_route(
      $namespace,
      '/admin/settings',
      [
        [
          'methods' => WP_REST_Server::READABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'get_item']
        ],
        [
          'methods' => WP_REST_Server::EDITABLE,
          'permission_callback' => 'is_events_admin',
          'callback' => [$this, 'update_item'],
          'args' => $this->get_endpoint_args_for_item_schema()
        ],
        'schema' => [$this, 'get_item_schema']
      ]
    );
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function get_item($request)
  {
    $settings = WPOE_Settings_Manager::get_settings();
    return new WP_REST_Response($settings);
  }

  /**
   * @param WP_REST_Request $request
   * @return WP_Error|WP_REST_Response
   */
  public function update_item($request)
  {
    $settings_to_update = (array) json_decode($request->get_body());
    $updated_settings = WPOE_Settings_Manager::update_settings($settings_to_update);
    return new WP_REST_Response($updated_settings);
  }

  public function get_item_schema()
  {
    // Returned cached copy whenever available.
    if ($this->schema) {
      return $this->add_additional_fields_schema($this->schema);
    }

    $schema = parent::get_item_schema();

    $schema['properties']['defaultAdminEmail'] = ['type' => 'string', 'required' => true];
    $schema['properties']['defaultAutoremovePeriod'] = ['type' => 'integer', 'required' => true, 'minimum' => 1];
    $schema['properties']['defaultExtraEmailContent'] = ['type' => 'string', 'required' => true];
    $schema['properties']['defaultTrackIpAddresses'] = ['type' => 'boolean', 'required' => true];

    // Cache generated schema on endpoint instance.
    $this->schema = $schema;

    return $this->add_additional_fields_schema($this->schema);
  }
}
