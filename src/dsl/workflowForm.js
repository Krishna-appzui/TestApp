/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * workflowForm
 * @author Bryan Nagle
 * @date 7/7/14
 * @namespace
 * @module
 */

module.exports = {
    default: {
        wfStep: {
            fields: [
                {
                    "name": "name"
                },
                {
                    "name": "alternateName"
                },
                {
                    "name": "accountPrefix"
                },
                {
                    "name": "accountSuffix"
                },
                {
                    "name": "reasonForNewSuffix"
                },
                {
                    "name": "contact"
                },
                {
                    "name": "comments"
                },
                {
                    "name": "website"
                },
                {
                    "name": "isPoRequired"
                },
                {
                    "name": "salesTerritory"
                },
                {
                    "name": "region"
                },
                {
                    "name": "sbu"
                },
                {
                    "name": "priceClass"
                },
                {
                    "name": "reasonForClass"
                },
                {
                    "name": "customerType"
                },
                {
                    "name": "distributionCenter"
                },
                {
                    "name": "addresses"
                },
                {
                    "name": "phones"
                },
                {
                    "name": "emails"
                }
            ]
        }
    },
    create: {
        wfStep: {
            fields: [
                {
                    "name": "name",
                    "dataType": "string",
                    "label": "Name"
                },
                {
                    "name": "alternateName",
                    "dataType": "string",
                    "label": "DBA Name"
                },
                {
                    "name": "contact",
                    "dataType": "string",
                    "label": "Contact"
                },
                {
                    "name": "comments",
                    "dataType": "string",
                    "label": "Comments"
                },
                {
                    "name": "website",
                    "dataType": "string",
                    "label": "Website"
                },
                {
                    "name": "isPoRequired",
                    "dataType": "boolean",
                    "label": "PO Required"
                },
                {
                    "dimensionType": true,
                    "name": "salesTerritory",
                    "dataType": "dimension",
                    "dimensionLevel": "/Org/company/sbu/region/subRegion/salesTerritory",
                    "multilevel": true,
                    "label": "Sales Rep",
                    "dimensionAttributes": [
                        {
                            "attribute": "validforaccountcrud",
                            "value": "Y"
                        }
                    ],
                    "update": [
                        {
                            "field": "region",
                            "level": "/Org/company/sbu/region"
                        },
                        {
                            "field": "sbu",
                            "level": "/Org/company/sbu"
                        },
                        {
                            "field": "priceClass"
                        },
                        {
                            "field": "distributionCenter"
                        },
                        {
                            "field": "customerType"
                        }
                    ]
                },
                {
                    "name": "region",
                    "dataType": "dimension",
                    "dimensionLevel": "/Org/company/sbu/region",
                    "label": "Region",
                    "readonly": true
                },
                {
                    "name": "sbu",
                    "dataType": "dimension",
                    "dimensionLevel": "/Org/company/sbu",
                    "readonly": true,
                    "label": "SBU"
                },
                {
                    "dimensionType": true,
                    "exampleData": "/Account/Region[SOUTHERNCAREGION]/priceClass[01A]\n",
                    "dimensionLevel": "/Account/priceClass",
                    "name": "priceClass",
                    "dataType": "dimension",
                    "comment": "drives pricing, gross margin. Changes require approval \n(aka Account Class in the legacy system)\n",
                    "label": "Customer Class",
                    "multilevel": true,
                    "function": "customDaltilePriceClassList",
                    "dependencies": [
                        "salesTerritory",
                        "salesTerritoryCountry"
                    ],
                    "dimensionAttributes": [
                        {
                            "attribute": "validforaccountcrud",
                            "value": "Y"
                        },
                        {
                            "attribute": "priceregion",
                            "field": "salesTerritory",
                            "level": "/Org/company/sbu/region"
                        },
                        {
                            "custom": "priceClassExceptions",
                            "field": "salesTerritoryCountry"
                        }
                    ]
                },
                {
                    "name": "reasonForClass",
                    "dataType": "string",
                    "label": "Reason For Class"
                },
                {
                    "dimensionType": true,
                    "dimensionLevel": "/Account/customerType",
                    "multilevel": true,
                    "name": "customerType",
                    "dataType": "dimension",
                    "label": "Customer Type",
                    "dependencies": [
                        "salesTerritory",
                        "salesTerritoryCountry"
                    ],
                    "dimensionAttributes": [
                        {
                            "attribute": "validforaccountcrud",
                            "value": "Y"
                        },
                        {
                            "attribute": "sbu",
                            "field": "salesTerritory",
                            "level": "/Org/company/sbu"
                        },
                        {
                            "attribute": "country",
                            "field": "salesTerritoryCountry"
                        }
                    ]
                },
                {
                    "name": "distributionCenter",
                    "dataType": "dimension",
                    "dimensionLevel": "/Org/company/sbu/region/subRegion/ssc",
                    "label": "SSC Name",
                    "multilevel": true,
                    "function": "customDaltileSscList",
                    "dependencies": [
                        "salesTerritory"
                    ],
                    "dimensionAttributes": [
                        {
                            "attribute": "validforaccountcrud",
                            "value": "Y"
                        },
                        {
                            "pathStartsWith": true,
                            "field": "salesTerritory",
                            "level": "/Org/company/sbu/region"
                        }
                    ]
                },
                {
                    "exampleData": "123 Main Street\nMain City, AL 23456",
                    "name": "addresses",
                    "listElementType": "block",
                    "dataType": "list",
                    "blockType": "Address",
                    "comment": "A list of address for an Account",
                    "label": "Address",
                    "display":false
                },
                {
                    "name": "phones",
                    "listElementType": "block",
                    "dataType": "list",
                    "blockType": "Phone",
                    "comment": "A list of phone numbers for an Account.",
                    "label": "Phone Number",
                    "display":false
                },
                {
                    "name": "emails",
                    "listElementType": "block",
                    "dataType": "list",
                    "blockType": "Email",
                    "comment": "A list of emails for an Account",
                    "label": "Email",
                    "display":true
                }
            ]
        },
        Address: {
            fields: [
                {
                    "dimensionType": true,
                    "exampleData": "/Data/communicationType[Work]",
                    "dimensionLevel": "/Data/communicationType",
                    "primary": true,
                    "name": "addressType",
                    "dataType": "dimension",
                    "comment": "Describes the address location [Work, Main, Home]",
                    "readonly": true,
                    "label": "Type"
                },
                {
                    "exampleData": "1500 N ANDREWS EXT",
                    "primary": true,
                    "name": "addressLine1",
                    "comment": "The primary address information (house number, street)",
                    "label": "Line 1"
                },
                {
                    "exampleData": "Suite 333",
                    "primary": true,
                    "name": "addressLine2",
                    "comment": "The secondary address information (apartment, unit number, floor)",
                    "label": "Line 2"
                },
                {
                    "exampleData": "c/o Zara Stone",
                    "primary": true,
                    "name": "addressLine3",
                    "comment": "The tertiary address information (care of, residential route#)",
                    "label": "Line 3"
                },
                {
                    "exampleData": "POMPANO BCH",
                    "name": "city",
                    "comment": "The city for the address",
                    "label": "City"
                },
                {
                    "dimensionType": true,
                    "exampleData": "/Global/country[USA]",
                    "dimensionLevel": "/Global/country",
                    "name": "country",
                    "dataType": "dimension",
                    "label": "Country",
                    "update": [
                        {
                            "field": "region"
                        }
                    ]
                },
                {
                    "dimensionType": true,
                    "exampleData": "/Global/country[USA]/region[FL]",
                    "dimensionLevel": "/Global/country/region",
                    "name": "region",
                    "dataType": "dimension",
                    "comment": "The state/territory for the address.  The exact values for this are dependent on the country",
                    "label": "Region",
                    "dimensionAttributes": [
                        {
                            "pathStartsWith": true,
                            "field": "country",
                            "level": "/Global/country"
                        }
                    ]
                },
                {
                    "exampleData": "32933",
                    "name": "postalCode",
                    "comment": "The postal code or zip code for the address",
                    "label": "Postal Code"
                },
                {
                    "exampleData": "GO TO BACK ENTER THIS CODE",
                    "name": "addressNote",
                    "comment": "comment on the address",
                    "label": "Note"
                },
                {
                    "dataType": "copyToButton",
                    "label": "Copy to BillTo",
                    "itemType": "Address",
                    "name": "addresses",
                    "visible": [
                        {
                            "field": "addressType",
                            "value": "/Data/communicationType[CustomerShipTo]",
                            "comparison": "e"
                        }
                    ],
                    "target": [
                        {
                            "field": "addressType",
                            "value": "/Data/communicationType[CustomerBillTo]",
                            "comparison": "e"
                        }
                    ],
                    "copyFields": [
                        "addressLine1",
                        "addressLine2",
                        "addressLine3",
                        "city",
                        "country",
                        "region",
                        "postalCode",
                        "addressNote"
                    ]
                }
            ]
        },
        Email: {
            fields: [
                {
                    "dimensionType": true,
                    "exampleData": "/Data/communicationType[Main]",
                    "dimensionLevel": "/Data/communicationType",
                    "primary": true,
                    "name": "emailType",
                    "dataType": "dimension",
                    "comment": "Identifies the type of email [Work, Home, Main]",
                    "label": "Type"
                },
                {
                    "exampleData": "hello@me.com",
                    "primary": true,
                    "name": "email",
                    "dataType": "email",
                    "comment": "email is sent as string",
                    "label": "Address"
                }
            ]
        },
        Phone: {
            fields: [
                {
                    "dimensionType": true,
                    "exampleData": "/Data/communicationType[Home]",
                    "dimensionLevel": "/Data/communicationType",
                    "primary": true,
                    "name": "phoneType",
                    "readonly": true,
                    "dataType": "dimension",
                    "comment": "Identifies the type of telephone numbers [mobile; home; fax; office]",
                    "label": "Type"
                },
                {
                    "exampleData": "01",
                    "primary": true,
                    "name": "phoneCountryCode",
                    "comment": "The country code for the telephone number",
                    "label": "Country Code"
                },
                {
                    "exampleData": "555-555-5555",
                    "primary": true,
                    "name": "phoneNumber",
                    "dataType": "phone",
                    "comment": "phone is sent as string",
                    "label": "Number"
                }
            ]
        }
    },
    edit: {
    wfStep: {
        fields: [
            {
                "name": "name",
                "dataType": "string",
                "label": "Name"
            },
            {
                "name": "alternateName",
                "dataType": "string",
                "label": "DBA Name"
            },
            {
                "name": "accountPrefix",
                "dataType": "string",
                "label": "Prefix"
            },
            {
                "name": "accountSuffix",
                "dataType": "string",
                "label": "Suffix"
            },
            {
                "name": "reasonForNewSuffix",
                "dataType": "string",
                "label": "Reason For Suffix"
            },
            {
                "name": "contact",
                "dataType": "string",
                "label": "Contact"
            },
            {
                "name": "comments",
                "dataType": "string",
                "label": "Comments"
            },
            {
                "name": "website",
                "dataType": "string",
                "label": "Website"
            },
            {
                "name": "isPoRequired",
                "dataType": "boolean",
                "label": "PO Required"
            },
            {
                "dimensionType": true,
                "name": "salesTerritory",
                "dataType": "dimension",
                "dimensionLevel": "/Org/company/sbu/region/subRegion/salesTerritory",
                "multilevel": true,
                "label": "Sales Rep",
                "dimensionAttributes": [
                    {
                        "attribute": "validforaccountcrud",
                        "value": "Y"
                    }
                ],
                "update": [
                    {
                        "field": "region",
                        "level": "/Org/company/sbu/region"
                    },
                    {
                        "field": "sbu",
                        "level": "/Org/company/sbu"
                    },
                    {
                        "field": "priceClass"
                    },
                    {
                        "field": "distributionCenter"
                    },
                    {
                        "field": "customerType"
                    }
                ]
            },
            {
                "name": "region",
                "dataType": "dimension",
                "dimensionLevel": "/Org/company/sbu/region",
                "label": "Region",
                "readonly": true
            },
            {
                "name": "sbu",
                "dataType": "dimension",
                "dimensionLevel": "/Org/company/sbu",
                "readonly": true,
                "label": "SBU"
            },
            {
                "dimensionType": true,
                "exampleData": "/Account/Region[SOUTHERNCAREGION]/priceClass[01A]\n",
                "dimensionLevel": "/Account/priceClass",
                "name": "priceClass",
                "dataType": "dimension",
                "comment": "drives pricing, gross margin. Changes require approval \n(aka Account Class in the legacy system)\n",
                "label": "Customer Class",
                "multilevel": true,
                "dependencies": [
                    "salesTerritory",
                    "salesTerritoryCountry"
                ],
                "dimensionAttributes": [
                    {
                        "attribute": "validforaccountcrud",
                        "value": "Y"
                    },
                    {
                        "attribute": "priceregion",
                        "field": "salesTerritory",
                        "level": "/Org/company/sbu/region"
                    },
                    {
                        "custom": "priceClassExceptions",
                        "field": "salesTerritoryCountry"
                    }
                ]
            },
            {
                "name": "reasonForClass",
                "dataType": "string",
                "label": "Reason For Class"
            },
            {
                "dimensionType": true,
                "dimensionLevel": "/Account/customerType",
                "multilevel": true,
                "name": "customerType",
                "dataType": "dimension",
                "label": "Customer Type",
                "dependencies": [
                    "salesTerritory",
                    "salesTerritoryCountry"
                ],
                "dimensionAttributes": [
                    {
                        "attribute": "validforaccountcrud",
                        "value": "Y"
                    },
                    {
                        "attribute": "sbu",
                        "field": "salesTerritory",
                        "level": "/Org/company/sbu"
                    },
                    {
                        "attribute": "country",
                        "field": "salesTerritoryCountry"
                    }
                ]
            },
            {
                "name": "distributionCenter",
                "dataType": "dimension",
                "dimensionLevel": "/Org/company/sbu/region/subRegion/ssc",
                "label": "SSC Name",
                "multilevel": true,
                "dependencies": [
                    "salesTerritory"
                ],
                "function": "customDaltileSscList",
                "dimensionAttributes": [
                    {
                        "attribute": "validforaccountcrud",
                        "value": "Y"
                    },
                    {
                        "pathStartsWith": true,
                        "field": "salesTerritory",
                        "level": "/Org/company/sbu/region"
                    }
                ]
            },
            {
                "exampleData": "123 Main Street\nMain City, AL 23456",
                "name": "addresses",
                "listElementType": "block",
                "dataType": "list",
                "blockType": "Address",
                "comment": "A list of address for an Account",
                "label": "Address",
                "display":false
            },
            {
                "name": "phones",
                "listElementType": "block",
                "dataType": "list",
                "blockType": "Phone",
                "comment": "A list of phone numbers for an Account.",
                "label": "Phone Number",
                "display":false
            },
            {
                "name": "emails",
                "listElementType": "block",
                "dataType": "list",
                "blockType": "Email",
                "comment": "A list of emails for an Account",
                "label": "Email",
                "display":true
            }
        ]
    },
    Address: {
        fields: [
            {
                "dimensionType": true,
                "exampleData": "/Data/communicationType[Work]",
                "dimensionLevel": "/Data/communicationType",
                "primary": true,
                "name": "addressType",
                "dataType": "dimension",
                "comment": "Describes the address location [Work, Main, Home]",
                "readonly": true,
                "label": "Type"
            },
            {
                "exampleData": "1500 N ANDREWS EXT",
                "primary": true,
                "name": "addressLine1",
                "comment": "The primary address information (house number, street)",
                "label": "Line 1"
            },
            {
                "exampleData": "Suite 333",
                "primary": true,
                "name": "addressLine2",
                "comment": "The secondary address information (apartment, unit number, floor)",
                "label": "Line 2"
            },
            {
                "exampleData": "c/o Zara Stone",
                "primary": true,
                "name": "addressLine3",
                "comment": "The tertiary address information (care of, residential route#)",
                "label": "Line 3"
            },
            {
                "exampleData": "POMPANO BCH",
                "name": "city",
                "comment": "The city for the address",
                "label": "City"
            },
            {
                "dimensionType": true,
                "exampleData": "/Global/country[USA]",
                "dimensionLevel": "/Global/country",
                "name": "country",
                "dataType": "dimension",
                "label": "Country",
                "update": [
                    {
                        "field": "region"
                    }
                ]
            },
            {
                "dimensionType": true,
                "exampleData": "/Global/country[USA]/region[FL]",
                "dimensionLevel": "/Global/country/region",
                "name": "region",
                "dataType": "dimension",
                "comment": "The state/territory for the address.  The exact values for this are dependent on the country",
                "label": "Region",
                "dimensionAttributes": [
                    {
                        "pathStartsWith": true,
                        "field": "country",
                        "level": "/Global/country"
                    }
                ]
            },
            {
                "exampleData": "32933",
                "name": "postalCode",
                "comment": "The postal code or zip code for the address",
                "label": "Postal Code"
            },
            {
                "exampleData": "GO TO BACK ENTER THIS CODE",
                "name": "addressNote",
                "comment": "comment on the address",
                "label": "Note"
            },
            {
                "dataType": "copyToButton",
                "label": "Copy to BillTo",
                "itemType": "Address",
                "name": "addresses",
                "visible": [
                    {
                        "field": "addressType",
                        "value": "/Data/communicationType[CustomerShipTo]",
                        "comparison": "e"
                    }
                ],
                "target": [
                    {
                        "field": "addressType",
                        "value": "/Data/communicationType[CustomerBillTo]",
                        "comparison": "e"
                    }
                ],
                "copyFields": [
                    "addressLine1",
                    "addressLine2",
                    "addressLine3",
                    "city",
                    "country",
                    "region",
                    "postalCode",
                    "addressNote"
                ]
            }
        ]

    },
    Email: {
        fields: [
            {
                "dimensionType": true,
                "exampleData": "/Data/communicationType[Main]",
                "dimensionLevel": "/Data/communicationType",
                "primary": true,
                "name": "emailType",
                "dataType": "dimension",
                "comment": "Identifies the type of email [Work, Home, Main]",
                "label": "Type"
            },
            {
                "exampleData": "hello@me.com",
                "primary": true,
                "name": "email",
                "dataType": "email",
                "comment": "email is sent as string",
                "label": "Address"
            }
        ]
    },
    Phone: {
        fields: [
            {
                "dimensionType": true,
                "exampleData": "/Data/communicationType[Home]",
                "dimensionLevel": "/Data/communicationType",
                "primary": true,
                "name": "phoneType",
                "readonly": true,
                "dataType": "dimension",
                "comment": "Identifies the type of telephone numbers [mobile; home; fax; office]",
                "label": "Type"
            },
            {
                "exampleData": "01",
                "primary": true,
                "name": "phoneCountryCode",
                "comment": "The country code for the telephone number",
                "label": "Country Code"
            },
            {
                "exampleData": "555-555-5555",
                "primary": true,
                "name": "phoneNumber",
                "dataType": "phone",
                "comment": "phone is sent as string",
                "label": "Number"
            }
        ]
    }
}
}