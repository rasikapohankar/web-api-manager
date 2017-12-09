(function () {
    "use strict";

    const Vue = window.Vue;

    const generateExportString = (domainsToExport, allDomainData) => {
        const dataToExport = domainsToExport.map(domain => {
            const standardIdsToBlock = allDomainData[domain];
            standardIdsToBlock.sort();
            return {
                "pattern": domain,
                "standardIds": standardIdsToBlock,
            };
        });

        return JSON.stringify(dataToExport);
    };

    Vue.component("import-export", {
        props: ["domainNames"],
        render: window.WEB_API_MANAGER.vueComponents["import-export"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["import-export"].staticRenderFns,
        data: function () {
            return {
                exportedData: "",
                domainsToExport: [],
                importError: false,
                importLog: "",
                importTextAreaData: "",
                dataToImport: "",
                shouldOverwrite: false,
            };
        },
        methods: {
            onImportClicked: function (event) {
                if (!this.isValidToImport()) {
                    this.importError = true;
                    this.dataToImport = "";
                    this.importLog = "No data to import.";
                    return;
                }

                const shouldOverwrite = !!this.shouldOverwrite;
                const stateObject = this.$root.$data;
                const currentDomainRules = stateObject.domainRules;
                const newDomainRules = this.dataToImport;
                this.importLog = "";

                const logMessages = newDomainRules.map(newDomainRule => {
                    const {pattern, standardIds} = newDomainRule;
                    if (currentDomainRules[pattern] !== undefined && shouldOverwrite === false) {
                        return ` ! ${pattern}: Skipped. Set to not override.\n`;
                    }

                    stateObject.setStandardIdsForDomain(pattern, standardIds);
                    return ` * ${pattern}: Blocking ${standardIds.length} standards.\n`;
                });

                this.importError = false;
                this.importLog = logMessages.join("\n");

                event.stopPropagation();
                event.preventDefault();
            },
            isValidToImport: function () {
                return (this.importError === false) && (this.dataToImport !== "");
            },
        },
        watch: {
            selectedStandardIds: function () {
                this.exportedData = generateExportString(
                    this.domainsToExport,
                    this.$root.$data.domainRules
                );
            },
            domainsToExport: function (selectedDomains) {
                this.exportedData = generateExportString(
                    selectedDomains,
                    this.$root.$data.domainRules
                );
            },
            importTextAreaData: function () {
                const value = this.importTextAreaData;

                if (value.trim() === "") {
                    this.dataToImport = "";
                    this.importError = false;
                    this.importLog = "";
                    return;
                }

                try {
                    this.dataToImport = JSON.parse(value);
                    this.importError = false;
                    this.importLog = "";
                } catch (ignore) {
                    this.dataToImport = "";
                    this.importError = true;
                    this.importLog = "Invalid import data provided.";
                }
            },
        },
    });
}());
