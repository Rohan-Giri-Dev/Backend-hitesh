import mongoose from "mongoose";

const hospitalSchema = mongoose.Schema(
  {
    name: {
      type: String,
      reequired: true,
    },
    addressLine1: {
      type: String,
      reequired: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    pin: {
      type: String,
      required: true,
    },
    specializedIn: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

export const Hospital = mongoose.model("Hospital", hospitalSchema);
