import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/important_contact.dart';

class SettingsScreen extends StatefulWidget {
  final VoidCallback onSettingsSaved;

  const SettingsScreen({Key? key, required this.onSettingsSaved}) : super(key: key);

  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _displayMode = "dark";
  double _bufferThreshold = 30;
  List<ImportantContact> _importantContacts = [];

  // Controllers
  final TextEditingController _contactNameController = TextEditingController();
  String _selectedCategory = "family";

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _displayMode = prefs.getString('displayMode') ?? "dark";
      _bufferThreshold = prefs.getDouble('bufferThreshold') ?? 30.0;
      
      final String? contactsJson = prefs.getString('importantContacts');
      if (contactsJson != null) {
        final List<dynamic> decoded = jsonDecode(contactsJson);
        _importantContacts = decoded
            .map((item) => ImportantContact.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        // Seed default priority contacts
        _importantContacts = [
          ImportantContact(name: "Mom", category: "family"),
          ImportantContact(name: "Dad", category: "family"),
          ImportantContact(name: "Ankit Manager", category: "office"),
        ];
      }
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('displayMode', _displayMode);
    await prefs.setDouble('bufferThreshold', _bufferThreshold);
    
    final String encoded = jsonEncode(_importantContacts.map((c) => c.toJson()).toList());
    await prefs.setString('importantContacts', encoded);

    widget.onSettingsSaved();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Preferences saved successfully!'),
        backgroundColor: Colors.amber,
      ),
    );
  }

  void _addImportantContact() {
    final name = _contactNameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a contact name')),
      );
      return;
    }

    setState(() {
      _importantContacts.add(
        ImportantContact(name: name, category: _selectedCategory),
      );
      _contactNameController.clear();
    });
    
    _saveSettings();
  }

  void _removeContact(int index) {
    setState(() {
      _importantContacts.removeAt(index);
    });
    _saveSettings();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('TASKLINE Preferences'),
        backgroundColor: isDark ? Colors.black87 : Colors.amber.shade700,
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: _saveSettings,
            tooltip: 'Save Settings',
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. THEME PREFERENCES
            _buildSectionHeader(Icons.brightness_medium, 'Display Theme'),
            const SizedBox(height: 10),
            Row(
              children: [
                _buildThemeButton('light', Icons.wb_sunny_outlined, 'Light'),
                const SizedBox(width: 8),
                _buildThemeButton('dark', Icons.nightlight_round_outlined, 'Dark'),
                const SizedBox(width: 8),
                _buildThemeButton('system', Icons.settings_brightness_outlined, 'System'),
              ],
            ),
            const SizedBox(height: 24),

            // 2. DELAY BUFFER PREFERENCE
            _buildSectionHeader(Icons.access_time, 'Automated Delay Risk Buffer'),
            const SizedBox(height: 8),
            Text(
              'Set buffer minutes before departure alarms trigger risk warnings.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
            ),
            Slider(
              value: _bufferThreshold,
              min: 10,
              max: 60,
              divisions: 10,
              activeColor: Colors.amber,
              label: '${_bufferThreshold.round()} Minutes',
              onChanged: (val) {
                setState(() {
                  _bufferThreshold = val;
                });
              },
            ),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '${_bufferThreshold.round()} mins threshold',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber),
              ),
            ),
            const SizedBox(height: 24),

            // 3. IMPORTANT CONTACT PANEL
            _buildSectionHeader(Icons.contact_phone, 'Important Contact'),
            const SizedBox(height: 6),
            Text(
              'add contacts names to automatically detect',
              style: TextStyle(
                fontSize: 13, 
                fontWeight: FontWeight.bold, 
                color: Colors.amber.shade600
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Inbound calls and SMS from these names bypass spam blockers and populate your rolling callback queue.',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 12),
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  children: [
                    TextField(
                      controller: _contactNameController,
                      decoration: const InputDecoration(
                        labelText: 'Contact Name Only',
                        hintText: 'e.g., Sis, Manager, Rohit Friend',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Text('Category:', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedCategory,
                            items: const [
                              DropdownMenuItem(value: 'family', child: Text('Family')),
                              DropdownMenuItem(value: 'office', child: Text('Office')),
                              DropdownMenuItem(value: 'friends', child: Text('Friends')),
                              DropdownMenuItem(value: 'others', child: Text('Others')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedCategory = val;
                                });
                              }
                            },
                            decoration: const InputDecoration(
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _addImportantContact,
                      icon: const Icon(Icons.add, color: Colors.black),
                      label: const Text('Add Priority Rule', style: TextStyle(color: Colors.black)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber,
                        minimumSize: const Size(double.infinity, 44),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 4. IMPORTANT CONTACT LIST
            const Text(
              'Active Automatic Detection Rules',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _importantContacts.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('No custom priority rules set yet.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _importantContacts.length,
                    itemBuilder: (context, idx) {
                      final c = _importantContacts[idx];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _getCategoryColor(c.category).withOpacity(0.2),
                            child: Icon(Icons.person, color: _getCategoryColor(c.category)),
                          ),
                          title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            c.category.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10, 
                              color: _getCategoryColor(c.category), 
                              fontWeight: FontWeight.bold
                            ),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () => _removeContact(idx),
                          ),
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.amber),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5),
        ),
      ],
    );
  }

  Widget _buildThemeButton(String mode, IconData icon, String label) {
    final isSelected = _displayMode == mode;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _displayMode = mode;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? Colors.amber.withOpacity(0.15) : Colors.transparent,
            border: Border.all(color: isSelected ? Colors.amber : Colors.grey.shade300),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.amber : Colors.grey),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? Colors.amber : Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor(String cat) {
    switch (cat.toLowerCase()) {
      case 'family':
        return Colors.pink;
      case 'office':
        return Colors.blue;
      case 'friends':
        return Colors.green;
      default:
        return Colors.orange;
    }
  }
}
