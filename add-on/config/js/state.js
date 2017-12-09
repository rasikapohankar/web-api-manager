(function () {
    "use strict";

    const {constants} = window.WEB_API_MANAGER;

    /**
     * Checks if two arrays contain the same values, regardless of order.
     *
     * @param {array} arrayOne
     *   One array to test.
     * @param {array} arrayTwo
     *   The second array to test against.
     *
     * @return {bool}
     *   Returns true if the two arrays contain all of the same values,
     *   an otherwise false.
     */
    const areArrayValuesIdentical = (arrayOne, arrayTwo) => {
        if (arrayOne.length !== arrayTwo.length) {
            return false;
        }

        const arrayOneSorted = arrayOne.sort();
        const arrayTwoSorted = arrayTwo.sort();

        const areAllValuesEqual = arrayOneSorted.every((value, index) => {
            return value === arrayTwoSorted[index];
        });

        return areAllValuesEqual;
    };

    /**
     * Checks if two domain rule sets describe the standard blocking same policy.
     *
     * This check is independent of the ordering of the domain matching rules
     * (the keys of the rule sets), or the standards that should be blocked
     * (the values in the rule sets).
     *
     * @param {object} firstRuleSet
     *   The first rule set to compare.
     * @param {object} secondRuleSet
     *   The second rule set to compare against.
     *
     * @return {bool}
     *   Returns true if the two objects describe identical policies
     *   (ie would block the same standards on the same domains), and
     *   otherwise false.
     */
    const areRuleSetsIdentical = (firstRuleSet, secondRuleSet) => {
        const firstRuleSetDomains = Object.keys(firstRuleSet).sort();
        const secondRuleSetDomains = Object.keys(secondRuleSet).sort();

        // First check if both rule sets have the same matching patterns
        // defined.  If not, then no need to consider further.
        const haveSameMatchPatterns = areArrayValuesIdentical(firstRuleSet, secondRuleSetDomains);

        if (haveSameMatchPatterns === false) {
            return false;
        }

        // Next, now that we know both rule sets have rules describing the
        // same domains, check that standards blocked for all domains are
        // the same.
        return firstRuleSetDomains.every(value => {
            if (secondRuleSet[value] === undefined) {
                return false;
            }

            return areArrayValuesIdentical(firstRuleSet[value], secondRuleSet[value]);
        });
    };

    const generateStateObject = (initialDomain) => {
        const state = {
            selectedDomain: initialDomain,
            domainRules: {},
            domainNames: [],
            shouldLog: false,
            selectedStandardIds: [],

            toStorage: function () {
                return {
                    domainRules: this.domainRules,
                    shouldLog: this.shouldLog,
                };
            },

            domainsBlockingNoStandards: function () {
                return this.domainNames
                    .filter(domain => this.domainRules[domain].length === 0)
                    .sort();
            },

            domainsBlockingStandards: function () {
                return this.domainNames
                    .filter(domain => this.domainRules[domain].length > 0)
                    .sort();
            },

            populateFromStorage: function (storedValues) {
                this.setDomainRules(storedValues.domainRules);
                this.setShouldLog(storedValues.shouldLog);
            },

            setDomainRules: function (newDomainRules) {
                const isRuleSetMatchingCurrentRules = areRuleSetsIdentical(
                    newDomainRules,
                    this.domainRules
                );

                // If the "new" domain rule set is identical to the existing
                // one, then don't set any propreties (to avoid unnecessarily
                // triggering storage and Vue.js callbacks).
                if (isRuleSetMatchingCurrentRules === true) {
                    return;
                }

                this.domainRules = newDomainRules;
                this.domainNames = Object.keys(newDomainRules);

                if (this.domainRules[this.selectedDomain] === undefined) {
                    this.selectedStandardIds = this.domainRules[this.defaultDomain];
                } else {
                    this.selectedStandardIds = this.domainRules[this.selectedDomain];
                }
            },

            setSelectedDomain: function (newDomain) {
                this.selectedDomain = newDomain;
                this.selectedStandardIds = this.domainRules[newDomain];
            },

            setSelectedStandardIds: function (selectedStandardIds) {
                this.selectedStandardIds = selectedStandardIds;
                this.domainRules[this.selectedDomain] = selectedStandardIds;
            },

            deleteDomainRule: function (domainToDelete) {
                // If we're deleted the domain thats currently selected, then
                // select the default domain.
                if (this.selectedDomain === domainToDelete) {
                    this.setSelectedDomain(constants.defaultDomainRule);
                }

                delete this.domainRules[domainToDelete];
                this.domainNames = Object.keys(this.domainRules);
            },

            addDomainRule: function (newDomainRule) {
                this.domainRules[newDomainRule] = [];
                this.domainNames = Object.keys(this.domainRules);
                this.selectedDomain = newDomainRule;
                this.selectedStandardIds = this.domainRules[newDomainRule];
            },

            setShouldLog: function (shouldLog) {
                this.shouldLog = shouldLog;
            },

            setStandardIdsForDomain: function (domain, standardIds) {
                this.domainRules[domain] = standardIds;
                this.domainNames = Object.keys(this.domainRules);
                if (domain === this.selectedDomain) {
                    this.selectedStandardIds = standardIds;
                }
            },
        };

        return state;
    };

    window.WEB_API_MANAGER.stateLib = {
        generateStateObject,
        areRuleSetsIdentical,
        areArrayValuesIdentical,
    };
}());
