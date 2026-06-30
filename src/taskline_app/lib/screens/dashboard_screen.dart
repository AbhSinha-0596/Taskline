import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/task.dart';
import '../models/important_contact.dart';
import '../utils/security_utils.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DateTime _simulatedTime = DateTime.now();
  List<Task> _tasks = [];
  List<ImportantContact> _importantContacts = [];
  bool _revealRawPhones = false;
  
  // Simulated mobile feed
  final List<Map<String, String>> _simulatedSmsInbox = [
    {
      'sender': 'Mom',
      'timestamp': '2 mins ago',
      'message': 'Hi beta, I am free now to make calls! Please call. Also, don\'t share your secret bank password "MummySpecial" or OTP 827103 with anyone.'
    },
    {
      'sender': 'ICICI Bank Alerts',
      'timestamp': '10 mins ago',
      'message': 'Your account ending 44102911 has been credited with Rs. 45,000. Secure OTP for transaction is 918237.'
    },
    {
      'sender': 'Ankit Manager',
      'timestamp': '15 mins ago',
      'message': 'Hi, I just finished my client demo and I am free to talk now. Reach me when you get this.'
    },
  ];

  final List<Map<String, String>> _simulatedCallLogs = [
    {'name': 'Mom (Maa)', 'phone': '+91-98765-43210', 'time': '10 mins ago', 'duration': 'Missed'},
    {'name': 'Ankit Manager', 'phone': '+91-99887-76655', 'time': '30 mins ago', 'duration': 'Missed'},
    {'name': 'Spam Seller', 'phone': '+91-90000-11111', 'time': '1 hour ago', 'duration': 'Missed'},
    {'name': 'Papa (Dad)', 'phone': '+91-98112-23344', 'time': '3 hours ago', 'duration': 'Missed'},
    {'name': 'Suresh Friend', 'phone': '+91-96655-44332', 'time': '5 hours ago', 'duration': 'Missed'},
  ];

  // Manual task builder inputs
  final _taskTitleController = TextEditingController();
  final _taskDescController = TextEditingController();
  String _taskCategory = "task";

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load dynamic contacts rules
    final String? contactsJson = prefs.getString('importantContacts');
    if (contactsJson != null) {
      final List<dynamic> decoded = jsonDecode(contactsJson);
      _importantContacts = decoded
          .map((item) => ImportantContact.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      _importantContacts = [
        ImportantContact(name: "Mom", category: "family"),
        ImportantContact(name: "Dad", category: "family"),
        ImportantContact(name: "Ankit Manager", category: "office"),
      ];
    }

    // Load tasks or seed initial
    final String? tasksJson = prefs.getString('tasks');
    if (tasksJson != null) {
      final List<dynamic> decoded = jsonDecode(tasksJson);
      _tasks = decoded
          .map((item) => Task.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      _tasks = [
        Task(
          id: 'task-1',
          title: 'Review Client Document',
          description: 'Check final terms with manager',
          category: 'task',
          dateTime: _simulatedTime.add(const Duration(hours: 1)),
        ),
        Task(
          id: 'task-2',
          title: 'Train Travel - Delhi Express',
          description: 'Departure scheduled',
          category: 'travel_train',
          trainNumber: '12002',
          dateTime: _simulatedTime.add(const Duration(hours: 2)),
        ),
      ];
      _saveTasks();
    }
    setState(() {});
  }

  Future<void> _saveTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(_tasks.map((t) => t.toJson()).toList());
    await prefs.setString('tasks', encoded);
  }

  void _addTask(String title, String desc, String category, {String? callerName, String? callerRole, String? trainNo}) {
    if (title.isEmpty) return;
    setState(() {
      _tasks.insert(
        0,
        Task(
          id: 'task-${DateTime.now().millisecondsSinceEpoch}',
          title: title,
          description: desc,
          category: category,
          dateTime: _simulatedTime.add(const Duration(minutes: 30)),
          callerName: callerName,
          callerRole: callerRole,
          trainNumber: trainNo,
        ),
      );
    });
    _saveTasks();
  }

  void _completeTask(int index) {
    setState(() {
      _tasks[index].isCompleted = !_tasks[index].isCompleted;
    });
    _saveTasks();
  }

  void _deleteTask(int index) {
    setState(() {
      _tasks.removeAt(index);
    });
    _saveTasks();
  }

  void _advanceTime(int minutes) {
    setState(() {
      _simulatedTime = _simulatedTime.add(Duration(minutes: minutes));
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('TASKLINE APP', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
        backgroundColor: isDark ? Colors.black87 : Colors.amber.shade700,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SettingsScreen(onSettingsSaved: _loadData),
                ),
              );
            },
          )
        ],
      ),
      body: Container(
        color: isDark ? Colors.grey.shade950 : Colors.grey.shade100,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. SIMULATED TIME BANNER
              _buildTimeBanner(isDark),
              const SizedBox(height: 16),

              // 2. PRIORITY QUEUE
              _buildSectionTitle(Icons.playlist_add_check, 'Rolling Priority Queue'),
              const SizedBox(height: 8),
              _buildTasksList(isDark),
              const SizedBox(height: 16),

              // 3. SECURE SMS INBOX WITH SECURE HASHING
              _buildSectionTitle(Icons.message, 'Secure SMS Interceptor (Hashed OTPs/PINs)'),
              const SizedBox(height: 8),
              _buildSecureSMSSection(isDark),
              const SizedBox(height: 16),

              // 4. CALL LOG READERS WITH PHONE ENCRYPTION
              _buildSectionTitle(Icons.phone_missed, 'Secure Call Logs (AES/DES Hashed Numbers)'),
              const SizedBox(height: 8),
              _buildCallLogsSection(isDark),
              const SizedBox(height: 16),

              // 5. MANUAL TASK BUILDER
              _buildSectionTitle(Icons.add_task, 'Add Task Entry'),
              const SizedBox(height: 8),
              _buildManualTaskBuilder(isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.amber),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5),
        ),
      ],
    );
  }

  Widget _buildTimeBanner(bool isDark) {
    return Card(
      color: isDark ? Colors.grey.shade900 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.between,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SIMULATED SYSTEM TIMELINE', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(
                  '${_simulatedTime.hour.toString().padLeft(2, '0')}:${_simulatedTime.minute.toString().padLeft(2, '0')} : ${_simulatedTime.second.toString().padLeft(2, '0')}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.amber),
                ),
              ],
            ),
            Row(
              children: [
                ElevatedButton(
                  onPressed: () => _advanceTime(15),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.amber, foregroundColor: Colors.black, minimumSize: const Size(60, 32)),
                  child: const Text('+15m', style: TextStyle(fontSize: 11)),
                ),
                const SizedBox(width: 6),
                ElevatedButton(
                  onPressed: () => _advanceTime(60),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.grey, foregroundColor: Colors.white, minimumSize: const Size(60, 32)),
                  child: const Text('+1h', style: TextStyle(fontSize: 11)),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTasksList(bool isDark) {
    if (_tasks.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isDark ? Colors.grey.shade900 : Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text('No active priority tasks.', style: TextStyle(color: Colors.grey)),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _tasks.length,
      itemBuilder: (context, index) {
        final task = _tasks[index];
        final isDelayRisk = task.category.startsWith('travel_') && task.delayMinutes! > 0;

        return Card(
          color: isDark ? Colors.grey.shade900 : Colors.white,
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isDelayRisk ? Colors.red.shade400 : (task.isCompleted ? Colors.green.shade200 : Colors.grey.shade800),
              width: 1,
            ),
          ),
          child: ListTile(
            leading: IconButton(
              icon: Icon(
                task.isCompleted ? Icons.check_circle : Icons.radio_button_off,
                color: task.isCompleted ? Colors.green : Colors.amber,
              ),
              onPressed: () => _completeTask(index),
            ),
            title: Text(
              task.title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                color: task.isCompleted ? Colors.grey : (isDark ? Colors.white : Colors.black),
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task.description, style: const TextStyle(fontSize: 12)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.amber.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                      child: Text(task.category.toUpperCase(), style: const TextStyle(fontSize: 9, color: Colors.amber, fontWeight: FontWeight.bold)),
                    ),
                    if (task.trainNumber != null) ...[
                      const SizedBox(width: 6),
                      Text('Train #${task.trainNumber}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                    ],
                    if (task.callerRole != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.blue.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                        child: Text(task.callerRole!.toUpperCase(), style: const TextStyle(fontSize: 9, color: Colors.blue, fontWeight: FontWeight.bold)),
                      ),
                    ]
                  ],
                ),
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.red),
              onPressed: () => _deleteTask(index),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSecureSMSSection(bool isDark) {
    return Card(
      color: isDark ? Colors.grey.shade900 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: _simulatedSmsInbox.map((sms) {
            final sender = sms['sender']!;
            final rawText = sms['message']!;
            final time = sms['timestamp']!;

            final parsed = SecurityUtils.redactAndHashSms(rawText);
            final avail = SecurityUtils.scanForCallAvailability(rawText);
            final isPermitted = SecurityUtils.isCallLogPermitted(sender, _importantContacts);
            final role = SecurityUtils.detectCallerRole(sender, _importantContacts);

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? Colors.black38 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isPermitted ? Colors.amber.withOpacity(0.2) : Colors.transparent),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Row(
                        children: [
                          Text(sender, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: isPermitted ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              isPermitted ? "PRIORITY: $role" : "BLOCKED",
                              style: TextStyle(
                                fontSize: 8, 
                                fontWeight: FontWeight.bold, 
                                color: isPermitted ? Colors.green : Colors.grey
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(time, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    parsed['redactedText'],
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                  ),
                  if (parsed['containsSensitiveInfo']) ...[
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.lock, size: 12, color: Colors.redAccent),
                        SizedBox(width: 4),
                        Text('Symmetric cryptographic redactions and hashes applied locally', style: TextStyle(fontSize: 9, color: Colors.redAccent, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                  if (avail['isAvailable'] && isPermitted) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.amber.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          Expanded(
                            child: Text(
                              'Availability Detected: "${avail['context']}"',
                              style: const TextStyle(fontSize: 11, color: Colors.amber, fontWeight: FontWeight.bold),
                            ),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              _addTask(
                                'Call Back - $sender',
                                'Auto-promoted from free status SMS. Text: "${parsed['redactedText']}"',
                                'family_call',
                                callerName: sender,
                                callerRole: role,
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Created callback task for $sender')),
                              );
                            },
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.amber, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: const Size(60, 28)),
                            child: const Text('Add Task', style: TextStyle(fontSize: 9)),
                          )
                        ],
                      ),
                    )
                  ]
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildCallLogsSection(bool _isDark) {
    return Card(
      color: _isDark ? Colors.grey.shade900 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text('Hashed Logs (Zero Server Leak)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _revealRawPhones = !_revealRawPhones;
                    });
                  },
                  icon: Icon(_revealRawPhones ? Icons.lock_open : Icons.lock, size: 12, color: Colors.amber),
                  label: Text(_revealRawPhones ? 'Hide Plain Numbers' : 'Decrypt View', style: const TextStyle(fontSize: 10, color: Colors.amber)),
                ),
              ],
            ),
            const Divider(),
            Column(
              children: _simulatedCallLogs.map((log) {
                final name = log['name']!;
                final phone = log['phone']!;
                final time = log['time']!;
                final isPermitted = SecurityUtils.isCallLogPermitted(name, _importantContacts);
                final role = SecurityUtils.detectCallerRole(name, _importantContacts);

                final encPhone = SecurityUtils.encryptPhoneNumber(phone);

                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: isPermitted ? Colors.amber.withOpacity(0.15) : Colors.grey.withOpacity(0.1),
                    child: Icon(Icons.phone_callback, color: isPermitted ? Colors.amber : Colors.grey, size: 18),
                  ),
                  title: Row(
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: isPermitted ? Colors.amber.withOpacity(0.15) : Colors.grey.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isPermitted ? "DETECTED: ${role.toUpperCase()}" : "SPAM/FILTERED",
                          style: TextStyle(
                            fontSize: 8, 
                            fontWeight: FontWeight.bold, 
                            color: isPermitted ? Colors.amber : Colors.grey
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text(
                    _revealRawPhones ? phone : encPhone,
                    style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                  ),
                  trailing: isPermitted
                      ? ElevatedButton(
                          onPressed: () {
                            _addTask(
                              'Priority Missed Call - $name',
                              'Callback urgent from Call logs sync ($time). Hashed Phone: $encPhone',
                              'family_call',
                              callerName: name,
                              callerRole: role,
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Callback scheduled for $name')),
                            );
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.amber, foregroundColor: Colors.black, minimumSize: const Size(60, 28)),
                          child: const Text('Add Task', style: TextStyle(fontSize: 10)),
                        )
                      : const Text('Blocked', style: TextStyle(fontSize: 10, color: Colors.grey, fontStyle: FontStyle.italic)),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManualTaskBuilder(bool isDark) {
    return Card(
      color: isDark ? Colors.grey.shade900 : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            TextField(
              controller: _taskTitleController,
              decoration: const InputDecoration(labelText: 'Task Title', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _taskDescController,
              decoration: const InputDecoration(labelText: 'Description / Notes', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _taskCategory,
              items: const [
                DropdownMenuItem(value: 'task', child: Text('Standard Task')),
                DropdownMenuItem(value: 'travel_train', child: Text('Train Travel Alert')),
                DropdownMenuItem(value: 'family_call', child: Text('Family / Callback alert')),
              ],
              onChanged: (val) {
                setState(() {
                  _taskCategory = val ?? "task";
                });
              },
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                if (_taskTitleController.text.trim().isEmpty) return;
                _addTask(_taskTitleController.text.trim(), _taskDescController.text.trim(), _taskCategory);
                _taskTitleController.clear();
                _taskDescController.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Task added successfully!')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 44),
              ),
              child: const Text('Insert Into Priority Queue', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }
}
