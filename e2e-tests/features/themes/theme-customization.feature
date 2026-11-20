@themes @admin
Feature: Theme customization
  Administrators change a theme's styles and the site stays usable on every screen size.

  Background:
    Given I am logged in as an administrator

  Scenario: A change to the theme's stylesheet shows on the site
    Given the test theme is in the themes folder
    And the site uses the test theme
    When I add this rule to the test theme's stylesheet:
      """
      #e2e-theme-marker { color: rgb(255, 0, 0); }
      """
    Then the theme marker on the home page has the colour "rgb(255, 0, 0)"

  Scenario: The site works on a phone-sized screen
    Given a page titled "Mobile page" is published
    When a visitor with a phone-sized screen opens the page "Mobile page"
    Then the page does not scroll sideways
    And the navigation menu is collapsed behind a menu button

  Scenario: The site shows the full menu on a desktop-sized screen
    Given a page titled "Desktop page" is published
    Then a visitor with a desktop-sized screen sees the navigation menu without a menu button of the page "Desktop page"
