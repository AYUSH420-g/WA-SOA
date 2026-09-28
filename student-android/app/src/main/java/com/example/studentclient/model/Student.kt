package com.example.studentclient.model

import com.google.gson.annotations.SerializedName

/**
 * Student Data Model
 */
data class Student(
    @SerializedName("id") val id: String? = null,
    @SerializedName("_id") val mongoId: String? = null,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("course") val course: String,
    @SerializedName("semester") val semester: Int
)

/**
 * API Response Wrapper matching Express.js payload
 */
data class StudentListResponse(
    @SerializedName("status") val status: Int,
    @SerializedName("message") val message: String,
    @SerializedName("count") val count: Int?,
    @SerializedName("data") val data: List<Student>?
)

data class StudentSingleResponse(
    @SerializedName("status") val status: Int,
    @SerializedName("message") val message: String,
    @SerializedName("data") val data: Student?
)

data class ErrorDetail(
    @SerializedName("field") val field: String?,
    @SerializedName("message") val message: String?
)

data class ErrorResponse(
    @SerializedName("status") val status: Int,
    @SerializedName("error") val error: String?,
    @SerializedName("message") val message: String?,
    @SerializedName("details") val details: List<ErrorDetail>?
)
