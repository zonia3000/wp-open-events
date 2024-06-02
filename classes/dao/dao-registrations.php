<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');
require_once (WPOE_PLUGIN_DIR . 'classes/dao/base-dao.php');

class WPOE_DAO_Registrations extends WPOE_Base_DAO
{
  public function __construct()
  {
    parent::__construct();
  }

  public function list_event_registrations(int $event_id, int $limit, int $offset): array
  {
    global $wpdb;
    $query = $wpdb->prepare("SELECT r.id, r.inserted_at, f.label, f.deleted, rv.field_value
      FROM " . WPOE_DB::get_table_name('event_registration') . " r
      RIGHT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = r.event_id
      LEFT JOIN " . WPOE_DB::get_table_name('event_registration_value') . " rv ON f.id = rv.field_id AND rv.registration_id = r.id
      JOIN (SELECT id FROM " . WPOE_DB::get_table_name('event_registration') . "
      WHERE event_id = %d ORDER BY id DESC LIMIT %d OFFSET %d) AS rpage ON r.id = rpage.id
      ORDER BY r.id DESC, f.deleted, f.position", $event_id, $limit, $offset);
    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the event registrations');

    $query = $wpdb->prepare('SELECT COUNT(*) FROM ' . WPOE_DB::get_table_name('event_registration')
      . ' WHERE event_id = %d', $event_id);
    $var = $wpdb->get_var($query);
    $this->check_var($var, 'retrieving the event registrations count');
    $total = (int) $var;

    $head_map = [];
    $body_map = [];
    $ids = [];
    foreach ($results as $result) {
      $id = (int) $result['id'];
      $inserted_at = $result['inserted_at'];
      if (!in_array($id, $ids)) {
        $ids[] = $id;
      }
      $label = $result['label'];
      $value = $result['field_value'];
      if (!array_key_exists($label, $head_map)) {
        $head_map[$label] = (bool) $result['deleted'];
      }
      if (array_key_exists($id, $body_map)) {
        $body_map[$id][$label] = $value;
      } else {
        $body_map[$id] = [
          'inserted_at' => $inserted_at,
          $label => $value
        ];
      }
    }

    $head_labels = [];
    $head = [];
    foreach ($head_map as $label => $deleted) {
      $head[] = ['label' => $label, 'deleted' => $deleted];
      $head_labels[] = $label;
    }

    $rows = [];
    foreach ($ids as $id) {
      $row_data = $body_map[$id];
      $row = [$body_map[$id]['inserted_at']];
      foreach ($head_labels as $label) {
        if (array_key_exists($label, $row_data)) {
          $cell = $row_data[$label];
        } else {
          $cell = '';
        }
        $row[] = $cell;
      }
      $rows[] = $row;
    }

    return [
      'head' => $head,
      'body' => $rows,
      'total' => $total
    ];
  }

  /**
   * Returns:
   * - null if the event has no maxiumum number of participants limit
   * - an integer representing the number of remaining available seats if there is a maxiumum number of participants limit
   * - false if there is a maxiumum number of participants limit and this limit has already been reached
   */
  public function register_to_event(int $event_id, ?string $registration_token, array $values, int|null $max_participants): int|false|null
  {
    global $wpdb;

    $remaining_seats = null;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Count the number of remaining seats
      if ($max_participants !== null) {
        $registrations_count = $this->get_registrations_count($event_id);
        $remaining_seats = $max_participants - $registrations_count;
        if ($remaining_seats <= 0) {
          // Unable to register: no more seats available
          $wpdb->query('ROLLBACK');
          return false;
        }
      }

      // Insert the registration
      $result = $wpdb->insert(
        WPOE_DB::get_table_name('event_registration'),
        [
          'event_id' => $event_id,
          'registration_token' => $registration_token,
        ],
        ['%d', '%s', '%s']
      );
      $this->check_result($result, 'inserting event registration');

      $registration_id = $wpdb->insert_id;

      // Insert the registration fields
      foreach ($values as $field_id => $field_value) {
        $result = $wpdb->insert(
          WPOE_DB::get_table_name('event_registration_value'),
          [
            'registration_id' => $registration_id,
            'field_id' => $field_id,
            'field_value' => $field_value,
          ],
          ['%d', '%d', '%s']
        );
        $this->check_result($result, 'inserting event registration field');
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'inserting registration');

    if ($remaining_seats !== null) {
      $remaining_seats--;
    }
    return $remaining_seats;
  }

  public function get_registration(string $registration_token): array|null
  {
    global $wpdb;

    $query = $wpdb->prepare('SELECT id FROM ' . WPOE_DB::get_table_name('event_registration') . ' WHERE registration_token = %s', $registration_token);
    $results = $wpdb->get_results($query);
    $this->check_results('retrieving registration');
    if (count($results) === 0) {
      return null;
    }
    if (count($results) > 1) {
      throw new Exception('Multiple registrations associated with the same token');
    }

    $registration_id = $results[0]->id;

    $query = $wpdb->prepare("SELECT f.label, rv.field_value
      FROM " . WPOE_DB::get_table_name('event_registration') . " r
      RIGHT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = r.event_id
      LEFT JOIN " . WPOE_DB::get_table_name('event_registration_value') . " rv ON f.id = rv.field_id AND rv.registration_id = r.id
      WHERE r.id = %d AND NOT f.deleted
      ORDER BY f.position", $registration_id);
    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the event registration value');

    $values = [];
    foreach ($results as $row) {
      array_push($values, $row['field_value']);
    }

    return [
      'id' => $registration_id,
      'values' => $values
    ];
  }

  public function update_registration(int $registration_id, array $values, int $event_id, int|null $max_participants): int|false|null
  {
    global $wpdb;

    $remaining_seats = null;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Update registration updated_at
      $result = $wpdb->update(
        WPOE_DB::get_table_name('event_registration'),
        ['updated_at' => current_time('mysql')],
        ['id' => $registration_id],
        ['%s'],
        ['%d']
      );
      $this->check_result($result, 'updating registration');

      // Delete the registration fields
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_registration_value'),
        ['registration_id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Insert the registration fields
      foreach ($values as $field_id => $field_value) {
        $result = $wpdb->insert(
          WPOE_DB::get_table_name('event_registration_value'),
          [
            'registration_id' => $registration_id,
            'field_id' => $field_id,
            'field_value' => $field_value,
          ],
          ['%d', '%d', '%s']
        );
        $this->check_result($result, 'inserting event registration field');
      }

      if ($max_participants !== null) {
        $registrations_count = $this->get_registrations_count($event_id);
        $remaining_seats = $max_participants - $registrations_count;
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'updating registration');
    return $remaining_seats;
  }

  public function delete_registration(int $registration_id, int $event_id, int|null $max_participants): int|null
  {
    global $wpdb;

    $remaining_seats = null;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Delete the registration fields
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_registration_value'),
        ['registration_id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration fields');

      // Delete the registration
      $result = $wpdb->delete(
        WPOE_DB::get_table_name('event_registration'),
        ['id' => $registration_id],
        ['%d']
      );
      $this->check_result($result, 'deleting event registration');

      if ($max_participants !== null) {
        $registrations_count = $this->get_registrations_count($event_id);
        $remaining_seats = $max_participants - $registrations_count;
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'deleting registration');

    return $remaining_seats;
  }

  private function get_registrations_count(int $event_id): int
  {
    global $wpdb;
    $query = $wpdb->prepare('SELECT COUNT(*) FROM ' . WPOE_DB::get_table_name('event_registration') . ' WHERE event_id = %d', $event_id);
    $var = $wpdb->get_var($query);
    $this->check_var($var, 'counting number of registrations');
    return (int) $var;
  }
}
