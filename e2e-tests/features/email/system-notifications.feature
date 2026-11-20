@email @admin
Feature: Form notification emails
  A form can send every response to one or more addresses. The email comes from
  the site's default From address and carries what the visitor entered.

  Background:
    Given I am logged in as an administrator
    And the mail catcher is running
    And the site sends its email through the mail catcher

  Scenario: A response is emailed to the owner of the form
    When I start a new form titled "Contact form"
    And I add these fields to the form:
      | Type       | Label     | Required |
      | Text field | Your name | yes      |
    And I send the responses of the form to "owner-<unique>@example.com"
    And I publish the form
    And I show the form "Contact form" on a new page "Contact"
    And a visitor opens the page "Contact"
    And the visitor fills in the form with:
      | Your name | Ada Lovelace |
    And the visitor submits the form
    Then the form is accepted
    And 1 email arrives
    And the email is addressed to "owner-<unique>@example.com"
    And the email comes from "example@localhost.com"
    And the email subject is the title of the form "Contact form"
    And the text of the email contains "Ada Lovelace"

  Scenario: The default From address of the site is used
    When I save the default From address "sender-<unique>@example.com"
    And I start a new form titled "From form"
    And I add these fields to the form:
      | Type       | Label     |
      | Text field | Your name |
    And I send the responses of the form to "owner-<unique>@example.com"
    And I publish the form
    And I show the form "From form" on a new page "From"
    And a visitor opens the page "From"
    And the visitor fills in the form with:
      | Your name | Alan Turing |
    And the visitor submits the form
    Then 1 email arrives
    And the email comes from "sender-<unique>@example.com"

  Scenario: A response is emailed to several addresses
    When I start a new form titled "Team form"
    And I add these fields to the form:
      | Type       | Label     |
      | Text field | Your name |
    And I send the responses of the form to "one-<unique>@example.com, two-<unique>@example.com"
    And I publish the form
    And I show the form "Team form" on a new page "Team"
    And a visitor opens the page "Team"
    And the visitor fills in the form with:
      | Your name | Katherine Johnson |
    And the visitor submits the form
    Then the email is addressed to "one-<unique>@example.com, two-<unique>@example.com"

  Scenario: A form without an address sends no email
    When I start a new form titled "Silent form"
    And I add these fields to the form:
      | Type       | Label     |
      | Text field | Your name |
    And I publish the form
    And I show the form "Silent form" on a new page "Silent"
    And a visitor opens the page "Silent"
    And the visitor fills in the form with:
      | Your name | Margaret Hamilton |
    And the visitor submits the form
    Then the form is accepted
    And no email is sent

  Scenario: A refused response sends no email
    When I start a new form titled "Strict form"
    And I add these fields to the form:
      | Type       | Label     | Required |
      | Text field | Your name | yes      |
    And I send the responses of the form to "owner-<unique>@example.com"
    And I publish the form
    And I show the form "Strict form" on a new page "Strict"
    And a visitor opens the page "Strict"
    And the visitor submits the form
    Then the form is not accepted
    And no email is sent
