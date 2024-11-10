# Job Scheduler

## Description

This project is a robust job scheduling system built with NestJS. It provides functionality for creating, managing, and executing both one-time and recurring jobs. The system is designed to handle job locking, automatic retries, and includes a mechanism to prevent jobs from getting stuck in a locked state.

## Features

- Create and manage jobs with customizable schedules
- Support for one-time and recurring jobs
- Job prioritization
- Automatic job retries with configurable retry limits
- Worker pool for parallel job execution
- Automatic unlocking of stuck jobs
- Monitoring and logging of job execution

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/job-scheduler.git
   ```

2. Install dependencies:

   ```
   cd job-scheduler
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```
   DATABASE_URL=your_database_url
   REDIS_URL=your_redis_url
   MAX_CONCURRENT_JOBS=5
   JOB_LOCK_TIMEOUT=300000
   ```

4. Run database migrations:
   ```
   npm run typeorm migration:run
   ```

## Usage

1. Start the application:

   ```
   npm run start
   ```

2. Access the API documentation at `http://localhost:3000/api`

3. Use the provided API endpoints to create and manage jobs

## Configuration

- `MAX_CONCURRENT_JOBS`: Maximum number of jobs that can run concurrently (default: 5)

## Architecture

The job scheduler consists of the following main components:

1. JobService: Manages job creation, updating, and retrieval
2. ExecutorService: Handles job execution and retry logic
3. WorkerPoolService: Manages a pool of worker threads for parallel job execution
4. JobUnlockService: Periodically checks for and unlocks stuck jobs
5. SchedulerService: Manages the scheduling and triggering of jobs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
