@file-storage @admin
Feature: Serving files
  Uploaded files are served by the render API and by Masa's asset route.

  Background:
    Given I am logged in as an administrator
    And a page titled "Serving" with the primary image "test-image.jpg" is published

  Scenario: Render API
    Then the render API serves the file inline as an image
    And the render API serves the file as a download with method attachment
    And the render API serves the source size byte for byte

  Scenario: Asset route streams cache files
    Then Masa streams the cached original inline with the right type
    And Masa streams the cached original as a download with method attachment

  Scenario: Missing assets
    Then a request for a missing asset is answered with a 404

  @security
  Scenario Outline: Path traversal is rejected
    Then the traversal request "<path>" is not served the settings file

    Examples:
      | path                                                                             |
      | /index.cfm/sites/default/assets/../../../config/settings.ini.cfm                 |
      | /index.cfm/sites/default/assets/%2e%2e%2f%2e%2e%2f%2e%2e%2fconfig/settings.ini.cfm |
      | /index.cfm/sites/default/assets/....//....//....//config/settings.ini.cfm         |
      | /index.cfm/sites/default/assets/..%5c..%5c..%5cconfig/settings.ini.cfm           |
      | /index.cfm/sites/default/cache/file/../../../../config/settings.ini.cfm           |
