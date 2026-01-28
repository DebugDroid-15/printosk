/**
 * Printosk ESP32 - Supabase REST Client
 * Communicates with Supabase PostgreSQL via REST API
 */

#ifndef SUPABASE_CLIENT_H
#define SUPABASE_CLIENT_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <string>

// Structure for print job data
struct PrintJob {
  char id[37];              // UUID string
  int print_id_numeric;     // 6-digit Print ID
  char job_title[256];
  bool color_mode;
  int copies;
  char paper_size[20];
  bool double_sided;
  char status[20];
  int total_pages;
  int file_count;
};

// Structure for job status update
struct JobStatusUpdate {
  char job_id[37];
  char new_status[20];
  char status_message[256];
};

class SupabaseClient {
public:
  /**
   * Initialize Supabase client with API credentials
   */
  bool init(const char* url, const char* apiKey);

  /**
   * Fetch print job by numeric ID
   * Returns true if successful, fills PrintJob struct
   */
  bool fetchJobByPrintId(int printId, PrintJob* job);

  /**
   * Get job status
   */
  bool getJobStatus(const char* jobId, char* status, int statusLen);

  /**
   * Update job status atomically
   */
  bool updateJobStatus(const JobStatusUpdate* update);

  /**
   * Mark job for deletion after successful print
   */
  bool markJobForDeletion(const char* jobId);

  /**
   * Check if connected to internet
   */
  bool isConnected();

private:
  std::string supabaseUrl;
  std::string apiKey;
  HTTPClient http;

  /**
   * Build Authorization header
   */
  std::string buildAuthHeader();

  /**
   * Build Content-Type header
   */
  std::string buildContentTypeHeader();

  /**
   * Parse error response from Supabase
   */
  void logError(const char* context, int httpCode, const std::string& response);
};

// Global instance
extern SupabaseClient supabaseClient;

#endif // SUPABASE_CLIENT_H
