import mongoose, { Schema, model, models } from "mongoose";

export interface QueryParam {
    key: string;
    value: string;
    isEnabled: boolean;
}

export interface Header {
    key: string;
    value: string;
    isEnabled: boolean;
}

export interface Authentication {
    type: "none" | "bearer" | "basic" | "apikey";
    key?: string;
    value?: string;
    username?: string;
    password?: string;
}

export interface RequestBody {
    type: "none" | "json" | "raw" | "form-data" | "x-www-form-urlencoded";
    content: string;
}

export interface Request {
    collectionId: mongoose.Types.ObjectId;
    name: string;
    method: "POST" | "PATCH" | "GET" | "DELETE" | "PUT";
    url: string;
    description?: string;
    queryParams: QueryParam[];
    headers: Header[];
    authentication: Authentication;
    body: RequestBody;
}

const QueryParamSchema: Schema<QueryParam> = new Schema({
    key: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    isEnabled: {
        type: Boolean,
        default: true
    }
}, { _id: false })

const HeaderSchema: Schema<Header> = new Schema({
    key: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    isEnabled: {
        type: Boolean,
        default: true
    }
}, { _id: false })

const RequestBodySchema: Schema<RequestBody> = new Schema({
    type: {
        type: String,
        enum: [
            "none", "json", "raw", "form-data", "x-www-form-urlencoded"
        ],
        default: "none",
        required: true
    },
    content: {
        type: String,
        default: ""
    }
}, { _id: false })

const AuthenticationSchema: Schema<Authentication> = new Schema({
    type: {
        type: String,
        enum: [
            "none", "bearer", "basic", "apikey"
        ],
        required: true,
        default: "none"
    },

    key: String,

    value: String,

    username: String,

    password: String,

}, { _id: false })

const RequestSchema: Schema<Request> = new Schema({
    collectionId: {
        type: Schema.Types.ObjectId,
        ref: "Collection",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    method: {
        type: String,
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        required: true
    },
    url: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000
    },
    queryParams: {
        type: [QueryParamSchema],
        default: []
    },
    headers: {
        type: [HeaderSchema],
        default: []
    },
    authentication: {
        type: AuthenticationSchema,
        default: () => ({
            type: "none",
        })
    },
    body: {
        type: RequestBodySchema,
        default: () => ({
            type: "none",
            content: ""
        })
    }
})

const RequestModel = models.Request as mongoose.Model<Request> || model<Request>("Request", RequestSchema);

export default RequestModel;