export declare const EXCHANGE_RATES_TO_USD: Record<string, number>;
export declare const UNIT_CONVERSIONS: Record<string, Record<string, number>>;
export declare const SUPPORTED_MIME_TYPES: {
    readonly 'application/pdf': "pdf";
    readonly 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': "docx";
    readonly 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': "xlsx";
    readonly 'application/vnd.ms-excel': "xls";
    readonly 'text/csv': "csv";
    readonly 'image/png': "image";
    readonly 'image/jpeg': "image";
    readonly 'image/tiff': "image";
    readonly 'message/rfc822': "email";
    readonly 'application/vnd.ms-outlook': "email";
};
export declare const QUESTIONNAIRE_QUESTIONS: readonly [{
    readonly id: "q1";
    readonly question: "Is the vendor ISO 9001 certified?";
    readonly type: "boolean";
    readonly required: true;
    readonly disqualifyIfFalse: true;
}, {
    readonly id: "q2";
    readonly question: "What is the lead time in days?";
    readonly type: "number";
    readonly required: true;
    readonly maxValue: 30;
    readonly disqualifyIfExceeds: true;
}, {
    readonly id: "q3";
    readonly question: "Does the vendor offer Net 30 payment terms?";
    readonly type: "boolean";
    readonly required: true;
    readonly disqualifyIfFalse: true;
}, {
    readonly id: "q4";
    readonly question: "Does the vendor comply with REACH regulations?";
    readonly type: "boolean";
    readonly required: false;
}, {
    readonly id: "q5";
    readonly question: "What is the warranty period in months?";
    readonly type: "number";
    readonly required: false;
    readonly minValue: 12;
}];
export declare const RFX_SEED: {
    id: string;
    name: string;
    description: string;
    lineItems: ({
        id: string;
        lineNumber: number;
        description: string;
        specification: string;
        quantity: number;
        unit: "EA";
        category: string;
        mandatory: boolean;
    } | {
        id: string;
        lineNumber: number;
        description: string;
        specification: string;
        quantity: number;
        unit: "M";
        category: string;
        mandatory: boolean;
    } | {
        id: string;
        lineNumber: number;
        description: string;
        specification: string;
        quantity: number;
        unit: "PC";
        category: string;
        mandatory: boolean;
    })[];
};
export declare const VENDORS_SEED: {
    id: string;
    name: string;
}[];
//# sourceMappingURL=constants.d.ts.map