"use client"

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";

export function userProductTour(activeRequest: any) {
    useEffect(() => {
        // Prevent running the product tour on non-desktop viewports
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            return;
        }

        const hasSeenTour1 = localStorage.getItem("has_seen_tour_part1");
        const hasSeenTour2 = localStorage.getItem("has_seen_tour_part2");

        // tour part-1 = General Workspace Layout
        // Runs on first load if the user hasn't seen it yet
        if (hasSeenTour1 !== "true") {
            const driverObj1 = driver({
                showProgress: true,
                animate: true,
                allowClose: false,
                overlayColor: "rgba(0, 0, 0, 0.92)",
                nextBtnText: "Next →",
                prevBtnText: "← Back",
                doneBtnText: "Got it!",

                steps: [
                    {
                        element: '[data-tour="left-dock"]',
                        popover: {
                            title: "Left Dock Navigation",
                            description: "Switch between your active API client workspace, collections vault, system analytics, and environment manager.",
                            side: "right",
                            align: "start"
                        }
                    },
                    {
                        element: '[data-tour="navbar-status"]',
                        popover: {
                            title: "Live Status Indicators",
                            description: "Instantly view which environment variables profile is active and whether requests run through the Server Proxy or Browser Direct.",
                            side: "bottom",
                            align: "center"
                        }
                    },
                    {
                        element: '[data-tour="workspace-selector"]',
                        popover: {
                            title: "Workspace Selection",
                            description: "Create, delete, and switch between your personal or team API workspaces using this selector dropdown.",
                            side: "right",
                            align: "start"
                        }
                    },
                    {
                        element: '[data-tour="collection-vault"]',
                        popover: {
                            title: "Collections Vault",
                            description: "Organize requests into folders and collections. Click the '+' icon next to collections to create a request and begin testing.",
                            side: "right",
                            align: "center"
                        }
                    }
                ],
                onDestroyed: () => {
                    localStorage.setItem("has_seen_tour_part1", "true");
                    
                    // If there is already an active request loaded, automatically chains and triggers Tour 2
                    if (activeRequest && localStorage.getItem("has_seen_tour_part2") !== "true") {
                        setTimeout(() => {
                            launchTour2();
                        }, 500);
                    }
                }
            });

            const timer = setTimeout(() => {
                driverObj1.drive();
            }, 1500);
            return () => clearTimeout(timer);
        }

        // tour part 2 = API Client Editor Details
        // Runs automatically once Tour 1 is complete and a request is open in the workspace.
        if (hasSeenTour1 === "true" && activeRequest && hasSeenTour2 !== "true") {
            const timer = setTimeout(() => {
                launchTour2();
            }, 1000);
            return () => clearTimeout(timer);
        }

        function launchTour2() {
            const driverObj2 = driver({
                showProgress: true,
                animate: true,
                allowClose: false,
                overlayColor: "rgba(0, 0, 0, 0.92)",
                nextBtnText: "Next →",
                prevBtnText: "← Back",
                doneBtnText: "Get Started!",

                steps: [
                    {
                        element: '[data-tour="request-metadata"]',
                        popover: {
                            title: "Request Identity Details",
                            description: "Name your requests and add descriptions to organize and document your workspace collection.",
                            side: "bottom",
                            align: "start"
                        }
                    },
                    {
                        element: '[data-tour="url-bar"]',
                        popover: {
                            title: "Method and URL Bar",
                            description: "Select HTTP verbs and input request URLs. Use double curly braces syntax to automatically resolve environment variables.",
                            side: "bottom",
                            align: "center"
                        }
                    },
                    {
                        element: '[data-tour="send-button"]',
                        popover: {
                            title: "Send Button and Agent Select",
                            description: "Execute requests instantly. Toggle between the Server Proxy (fully secure server-side execution) and Browser Direct (to hit local servers or bypass proxy restrictions).",
                            side: "bottom",
                            align: "end"
                        }
                    },
                    {
                        element: '[data-tour="request-option-tabs"]',
                        popover: {
                            title: "Request Configuration Tabs",
                            description: "Refine requests with custom query parameters, headers, authentication mechanisms, or request bodies.",
                            side: "bottom",
                            align: "start"
                        }
                    },
                    {
                        element: '[data-tour="response-viewer"]',
                        popover: {
                            title: "Response and Telemetry Viewer",
                            description: "View returned HTTP status codes, execution timings, response headers, and colorized JSON or text body payloads.",
                            side: "top",
                            align: "center"
                        }
                    },
                    {
                        element: '[data-tour-tab="snippets"]',
                        popover: {
                            title: "Code Snippet Generator",
                            description: "Generate production-ready code snippets instantly in cURL, Fetch, Axios, Python, and Go.",
                            side: "left",
                            align: "center"
                        }
                    },
                    {
                        element: '[data-tour-tab="globals"]',
                        popover: {
                            title: "Active ENVs Inspector",
                            description: "Quickly view and inspect all configured variables for the selected environment profile without changing pages. You can reveal secrets by clicking the eye icon.",
                            side: "left",
                            align: "center"
                        }
                    },
                    {
                        element: '[data-tour-tab="history"]',
                        popover: {
                            title: "Request History Logs",
                            description: "Audit previously sent requests. Click on any past log entry to instantly reload it in the active workspace editor.",
                            side: "left",
                            align: "center"
                        }
                    }
                ],

                onHighlightStarted: (element) => {
                    if (!element) return;
                    const tourTab = element.getAttribute("data-tour-tab");
                    if (tourTab === "snippets" || tourTab === "globals" || tourTab === "history") {
                        const btn = document.querySelector(`[data-tour-tab="${tourTab}"]`) as HTMLButtonElement | null;
                        if (btn) btn.click();
                    }
                },

                onDestroyed: () => {
                    localStorage.setItem("has_seen_tour_part2", "true");
                }
            });
            driverObj2.drive();
        }
    }, [activeRequest]);
}