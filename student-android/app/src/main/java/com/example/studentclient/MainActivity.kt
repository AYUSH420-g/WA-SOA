package com.example.studentclient

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.studentclient.adapter.StudentAdapter
import com.example.studentclient.api.RetrofitClient
import com.example.studentclient.databinding.ActivityMainBinding
import com.example.studentclient.model.StudentListResponse
import com.example.studentclient.model.StudentSingleResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: StudentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = getString(R.string.title_students)

        setupRecyclerView()

        binding.fabAddStudent.setOnClickListener {
            val intent = Intent(this, AddStudentActivity::class.java)
            startActivity(intent)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menu?.add(Menu.NONE, 1, Menu.NONE, getString(R.string.action_search))
            ?.setIcon(android.R.drawable.ic_menu_search)
            ?.setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            1 -> {
                showSearchDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun showSearchDialog() {
        val input = EditText(this).apply {
            hint = getString(R.string.search_dialog_hint)
            setPadding(48, 32, 48, 32)
        }

        AlertDialog.Builder(this)
            .setTitle(getString(R.string.search_dialog_title))
            .setView(input)
            .setPositiveButton(getString(R.string.btn_search)) { _, _ ->
                val idToFind = input.text.toString().trim()
                if (idToFind.isNotEmpty()) {
                    lookupStudentById(idToFind)
                }
            }
            .setNegativeButton(getString(R.string.btn_cancel), null)
            .show()
    }

    /**
     * GET /students/{id}
     * Demonstrates HTTP 404 vs 200 contract response for mobile client.
     */
    private fun lookupStudentById(studentId: String) {
        binding.progressBar.visibility = View.VISIBLE

        RetrofitClient.instance.getStudentById(studentId).enqueue(object : Callback<StudentSingleResponse> {
            override fun onResponse(call: Call<StudentSingleResponse>, response: Response<StudentSingleResponse>) {
                binding.progressBar.visibility = View.GONE

                if (response.isSuccessful && response.body()?.data != null) {
                    val student = response.body()!!.data!!
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("Student Found (200 OK)")
                        .setMessage("Name: ${student.name}\nEmail: ${student.email}\nCourse: ${student.course}\nSemester: Sem ${student.semester}\nID: ${student.id ?: student.mongoId}")
                        .setPositiveButton("OK", null)
                        .show()
                    Toast.makeText(this@MainActivity, "Student found: ${student.name}", Toast.LENGTH_SHORT).show()
                } else if (response.code() == 404) {
                    // Service Contract: Show Toast: "Student not found"
                    Toast.makeText(this@MainActivity, "Student not found", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this@MainActivity, "Server Error: ${response.code()}", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<StudentSingleResponse>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                // Service Contract: 5xx / network issue -> Show Toast: "Something went wrong"
                Toast.makeText(this@MainActivity, "Something went wrong", Toast.LENGTH_LONG).show()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        fetchStudents()
    }

    private fun setupRecyclerView() {
        adapter = StudentAdapter()
        binding.recyclerViewStudents.layoutManager = LinearLayoutManager(this)
        binding.recyclerViewStudents.adapter = adapter
    }

    private fun fetchStudents() {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvEmptyState.visibility = View.GONE
        binding.recyclerViewStudents.visibility = View.GONE

        RetrofitClient.instance.getAllStudents().enqueue(object : Callback<StudentListResponse> {
            override fun onResponse(call: Call<StudentListResponse>, response: Response<StudentListResponse>) {
                binding.progressBar.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val studentList = response.body()?.data ?: emptyList()
                    if (studentList.isEmpty()) {
                        binding.tvEmptyState.visibility = View.VISIBLE
                    } else {
                        binding.recyclerViewStudents.visibility = View.VISIBLE
                        adapter.updateData(studentList)
                    }
                    Toast.makeText(this@MainActivity, "Loaded ${studentList.size} students (200 OK)", Toast.LENGTH_SHORT).show()
                } else if (response.code() == 404) {
                    binding.tvEmptyState.visibility = View.VISIBLE
                    Toast.makeText(this@MainActivity, "Student not found", Toast.LENGTH_LONG).show()
                } else {
                    binding.tvEmptyState.visibility = View.VISIBLE
                    Toast.makeText(this@MainActivity, "Server Error: ${response.code()} ${response.message()}", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<StudentListResponse>, t: Throwable) {
                binding.progressBar.visibility = View.GONE
                binding.tvEmptyState.visibility = View.VISIBLE
                // Service Contract: 5xx / network issue -> Show Toast: "Something went wrong"
                Toast.makeText(this@MainActivity, "Something went wrong", Toast.LENGTH_LONG).show()
            }
        })
    }
}
