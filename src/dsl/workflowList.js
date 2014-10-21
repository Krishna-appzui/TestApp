/*
 * Copyright Everglade Solutions, Inc., d/b/a Liquid Analytics 2014. All rights reserved.
 */

/**
 * workflowList.js
 * @author Bryan Nagle
 * @date 9/10/14
 * @namespace
 * @module
 */

module.exports = function(userId) {
    return { predefinedFilters: [
        {
            id: 'MyApprovals',
            label: 'My Approvals',
            sort: { value: 'h_createdat', desc: false },
            queryFilter: [
                [
                    {
                        field: 'approver',
                        value: userId,
                        comparison: 'e'
                    }
                ],
                [
                    {
                        field: 'state',
                        value: 'Pending',
                        comparison: 'e'
                    }
                ]
            ]

        },
        {
            id: 'MyWorkflows',
            label: 'My Workflows',
            sort: { value: 'h_createdat', desc: true },
            queryFilter: [
                [
                    {
                        field: 'requestor',
                        value: userId,
                        comparison: 'e'
                    }
                ]
            ]

        },
        {
            id: 'MyWorkflowsApproval',
            label: 'My Pending Workflows',
            sort: { value: 'h_createdat', desc: true },
            queryFilter: [
                [
                    {
                        field: 'requestor',
                        value: userId,
                        comparison: 'e'
                    }
                ],
                [
                    {
                        field: 'state',
                        value: 'Processed',
                        comparison: 'ne'
                    }
                ],
                [
                    {
                        field: 'status',
                        value: 'Closed',
                        comparison: 'ne'
                    }
                ],
                [
                    {
                        field: 'state',
                        value: 'Rejected',
                        comparison: 'ne'
                    }
                ]
            ]

        },
        {
            id: 'AllWorkflows',
            label: 'All Workflows'
        }
    ]
    }
}