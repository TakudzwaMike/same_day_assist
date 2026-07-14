import React, { useState } from 'react';
import { Database, Terminal, Shield, RefreshCw, FileText, CheckCircle, Table2, ShieldAlert, Play } from 'lucide-react';
import { AppState, Enquiry } from '../types';
import { DATABASE_SCHEMAS } from '../data/mockData';

interface DevConsoleProps {
  state: AppState;
  clearLocalStorage: () => void;
  updateState: (newState: Partial<AppState>) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function DevConsole({ state, clearLocalStorage, updateState, addAuditLog }: DevConsoleProps) {
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [activePane, setActivePane] = useState<'schema' | 'explorer' | 'terminal'>('explorer');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM customers;');
  const [terminalOutput, setTerminalOutput] = useState<{ type: 'input' | 'output' | 'error' | 'success', text: string, data?: any[] }[]>([
    { type: 'success', text: 'PSQL Client v15.2 (Sandton Hub Cloud SQL cluster) connected successfully.' },
    { type: 'output', text: 'Sandbox SQL Engine initialized. Use SELECT, UPDATE, DELETE, or INSERT commands.' }
  ]);

  // Helper: Retrieve table records dynamically
  const getTableRecords = () => {
    switch (selectedTable) {
      case 'enquiries':
        return state.enquiries;
      case 'assessments':
        return state.assessments;
      case 'quotations':
        return state.quotations;
      case 'customers':
        return state.customers;
      case 'jobs':
        return state.jobs;
      case 'payments':
        return state.payments;
      case 'audit_logs':
        return state.auditLogs;
      default:
        return [];
    }
  };

  const executeSql = (queryToRun: string) => {
    const query = queryToRun.trim();
    if (!query) return;

    const newHistoryItem = { type: 'input' as const, text: query };
    const cleanQuery = query.toLowerCase().replace(/;/g, '').trim();

    if (cleanQuery === 'clear') {
      setTerminalOutput([]);
      setSqlQuery('');
      return;
    }

    let outputText = '';
    let outputType: 'success' | 'error' | 'output' = 'success';
    let outputData: any[] | undefined = undefined;

    try {
      if (cleanQuery.startsWith('select')) {
        if (cleanQuery.includes('from enquiries')) {
          outputData = state.enquiries;
          outputText = `SELECT: ${state.enquiries.length} rows retrieved from enquiries.`;
        } else if (cleanQuery.includes('from assessments')) {
          outputData = state.assessments;
          outputText = `SELECT: ${state.assessments.length} rows retrieved from assessments.`;
        } else if (cleanQuery.includes('from quotations')) {
          outputData = state.quotations;
          outputText = `SELECT: ${state.quotations.length} rows retrieved from quotations.`;
        } else if (cleanQuery.includes('from customers')) {
          outputData = state.customers;
          outputText = `SELECT: ${state.customers.length} rows retrieved from customers.`;
        } else if (cleanQuery.includes('from jobs')) {
          outputData = state.jobs;
          outputText = `SELECT: ${state.jobs.length} rows retrieved from jobs.`;
        } else if (cleanQuery.includes('from payments')) {
          outputData = state.payments;
          outputText = `SELECT: ${state.payments.length} rows retrieved from payments.`;
        } else if (cleanQuery.includes('from audit_logs')) {
          outputData = state.auditLogs;
          outputText = `SELECT: ${state.auditLogs.length} rows retrieved from audit_logs.`;
        } else {
          throw new Error('Table name not found. Supported: enquiries, assessments, quotations, customers, jobs, payments, audit_logs.');
        }
      } else if (cleanQuery.startsWith('update')) {
        if (cleanQuery.includes('update customers')) {
          if (cleanQuery.includes("status = 'active'") || cleanQuery.includes("status='active'")) {
            const updated = state.customers.map(c => ({ ...c, status: 'Active' as const }));
            updateState({ customers: updated });
            outputText = `UPDATE OK: ${updated.length} rows modified in customers. All clients status set to Active.`;
            addAuditLog('SQL Data Patch', `Executed SQL: UPDATE customers SET status = 'Active';`);
          } else {
            throw new Error("Syntax constraint: Only SET status = 'Active' is supported to activate all customers.");
          }
        } else if (cleanQuery.includes('update contractors')) {
          if (cleanQuery.includes('isavailable = true') || cleanQuery.includes('isavailable=true')) {
            const updated = state.contractors.map(c => ({ ...c, isAvailable: true }));
            updateState({ contractors: updated });
            outputText = `UPDATE OK: ${updated.length} rows modified in contractors. Standby status restored.`;
            addAuditLog('SQL Data Patch', `Executed SQL: UPDATE contractors SET isAvailable = true;`);
          } else {
            throw new Error("Syntax constraint: Only SET isAvailable = true is supported to free up all responders.");
          }
        } else {
          throw new Error('Unsupported UPDATE table. Supported in sandbox: customers, contractors.');
        }
      } else if (cleanQuery.startsWith('delete')) {
        if (cleanQuery.includes('from jobs')) {
          updateState({ jobs: [] });
          outputText = `DELETE OK: All rows removed from jobs. Active emergency queues cleared.`;
          addAuditLog('SQL Flush', 'Executed SQL: DELETE FROM jobs;');
        } else if (cleanQuery.includes('from enquiries')) {
          updateState({ enquiries: [] });
          outputText = `DELETE OK: All rows removed from enquiries. Backlog flushed.`;
          addAuditLog('SQL Flush', 'Executed SQL: DELETE FROM enquiries;');
        } else {
          throw new Error('Unsupported DELETE statement. Supported in sandbox: jobs, enquiries.');
        }
      } else if (cleanQuery.startsWith('insert')) {
        if (cleanQuery.includes('into enquiries')) {
          const newEnq: Enquiry = {
            id: `enq-sql-${Date.now().toString().slice(-3)}`,
            customerName: 'President Nelson',
            email: 'nelson@presidency.gov.za',
            phone: '+27 12 345 6789',
            address: 'Union Buildings, Pretoria',
            serviceCategory: 'Security',
            notes: 'High-priority presidential safety compliance audit logged via SQL',
            status: 'Pending',
            createdAt: new Date().toISOString()
          };
          updateState({ enquiries: [newEnq, ...state.enquiries] });
          outputText = `INSERT OK: 1 row inserted into enquiries. Generated ID: ${newEnq.id}`;
          addAuditLog('SQL Transaction', 'Executed SQL: INSERT INTO enquiries for Union Buildings Presidential audit.');
        } else {
          throw new Error('Unsupported INSERT command. Try executing the sample: "INSERT INTO enquiries (...);"');
        }
      } else {
        throw new Error('Unsupported SQL dialect. Sandbox engine supports: SELECT, UPDATE, DELETE, INSERT, CLEAR.');
      }
    } catch (err: any) {
      outputType = 'error';
      outputText = `SQL_ERROR: ${err.message || 'Invalid syntax near token.'}`;
    }

    setTerminalOutput(prev => [
      ...prev,
      newHistoryItem,
      { type: outputType, text: outputText, data: outputData }
    ]);
  };

  const currentRecords = getTableRecords();
  const currentSchema = DATABASE_SCHEMAS.find(s => s.tableName === selectedTable);

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-5 font-mono animate-fadeIn">
      
      {/* Dev Console Header */}
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-red" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">SAME DAY ASSIST (PTY) LTD — DEVELOPER CONSOLE</h3>
            <p className="text-[10px] text-slate-500">Live Normalised SQL Schema Explorer & State Inspector</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActivePane('explorer')}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
              activePane === 'explorer' 
                ? 'bg-red border-red text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>DB Records Explorer</span>
          </button>
          <button 
            onClick={() => setActivePane('schema')}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
              activePane === 'schema' 
                ? 'bg-red border-red text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL Schema DDL</span>
          </button>
          <button 
            onClick={() => setActivePane('terminal')}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all flex items-center gap-1.5 ${
              activePane === 'terminal' 
                ? 'bg-red border-red text-white' 
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-green-400" />
            <span>Interactive SQL Terminal</span>
          </button>
          <button 
            onClick={() => {
              if (confirm('Reset simulated database to pristine factory seed data?')) {
                clearLocalStorage();
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-red hover:text-white rounded-lg font-bold transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>

      {/* Primary side-by-side content */}
      <div className="grid grid-cols-5 gap-6">
        
        {/* Table selector side rail */}
        <div className="col-span-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Normalised Tables</span>
          {[
            { id: 'enquiries', label: 'enquiries' },
            { id: 'assessments', label: 'assessments' },
            { id: 'quotations', label: 'quotations' },
            { id: 'customers', label: 'customers' },
            { id: 'jobs', label: 'jobs' },
            { id: 'payments', label: 'payments' },
            { id: 'audit_logs', label: 'audit_logs' }
          ].map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table.id)}
              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-mono ${
                selectedTable === table.id 
                  ? 'bg-slate-800 text-red font-bold border border-slate-700' 
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              <span>{table.label}</span>
              <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.2 rounded">
                SQL
              </span>
            </button>
          ))}
        </div>

        {/* Core display terminal */}
        <div className="col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col gap-4 overflow-hidden min-h-[350px]">
          
          {/* PANE: SCHEMA DDL EXPLAINER */}
          {activePane === 'schema' && currentSchema && (
            <div className="space-y-4 animate-fadeIn flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-300">TABLE DEFINITION: "{currentSchema.tableName}"</span>
                  <span className="text-[10px] text-green-400">POSTGRESQL / CLOUD SQL COMPLIANT</span>
                </div>
                
                {/* Column Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="pb-1.5">Column Name</th>
                        <th className="pb-1.5">Data Type</th>
                        <th className="pb-1.5">Constraints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {currentSchema.columns.map((col, idx) => (
                        <tr key={idx} className="hover:text-slate-200">
                          <td className="py-1.5 font-bold text-slate-300">{col.name}</td>
                          <td className="py-1.5 text-red">{col.type}</td>
                          <td className="py-1.5 font-mono text-[10px] text-slate-500">{col.constraint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Indexes and Keys footer */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11.5px] space-y-1.5">
                <p className="font-bold text-slate-300">INDEXES DEFINED:</p>
                <div className="flex gap-2 flex-wrap">
                  {currentSchema.indexes.map((idx, i) => (
                    <span key={i} className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                      CREATE INDEX {idx} ON {currentSchema.tableName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANE: ACTIVE RECORD EXPLORER */}
          {activePane === 'explorer' && (
            <div className="space-y-3 animate-fadeIn flex flex-col h-full justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase">Interactive Records: "{selectedTable}"</span>
                <span className="text-[10px] text-slate-500 font-mono">Row Count: {currentRecords.length}</span>
              </div>

              {/* Grid viewer */}
              <div className="overflow-auto flex-1 max-h-72">
                {currentRecords.length > 0 ? (
                  <table className="w-full text-left text-[10px] text-slate-400 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]">
                        {Object.keys(currentRecords[0]).slice(0, 5).map((key, i) => (
                          <th key={i} className="pb-2 pr-4">{key}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {currentRecords.map((rec: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/50 hover:text-slate-200">
                          {Object.keys(rec).slice(0, 5).map((key, i) => (
                            <td key={i} className="py-2 pr-4 max-w-[150px] truncate">
                              {typeof rec[key] === 'object' 
                                ? JSON.stringify(rec[key]).slice(0, 20) + '...' 
                                : String(rec[key])}
                            </td>
                          ))}
                          <td className="py-2 text-red font-bold cursor-pointer hover:underline" onClick={() => alert(JSON.stringify(rec, null, 2))}>
                            View JSON
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16 text-slate-600 text-xs">
                    No active SQL records stored in simulated database for table "{selectedTable}".
                  </div>
                )}
              </div>

              {/* Sync warning footer */}
              <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Simulated ORM layer is actively mirroring local storage transitions into structured relational schemas in real-time.</span>
              </div>
            </div>
          )}

          {/* PANE: INTERACTIVE SQL TERMINAL */}
          {activePane === 'terminal' && (
            <div className="space-y-3 animate-fadeIn flex flex-col h-full justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-green-400 animate-pulse" />
                  <span>Interactive SQL Command Line Console</span>
                </span>
                <span className="text-[10px] text-green-400 font-mono">STATUS: CLOUD_CONNECTED</span>
              </div>

              {/* Terminal Logs scrolling core */}
              <div className="bg-black/85 rounded-xl p-4 border border-slate-800 font-mono text-[11px] overflow-y-auto flex-1 min-h-[220px] max-h-[300px] flex flex-col gap-2 scrollbar-thin">
                {terminalOutput.map((log, i) => (
                  <div key={i} className="space-y-1">
                    {log.type === 'input' ? (
                      <p className="text-slate-400 font-semibold">
                        <span className="text-red font-bold">sda_db_central=&gt;</span> {log.text}
                      </p>
                    ) : log.type === 'error' ? (
                      <p className="text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30 font-bold whitespace-pre-wrap">
                        {log.text}
                      </p>
                    ) : log.type === 'success' ? (
                      <p className="text-green-400 font-semibold">{log.text}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-slate-300 font-bold">{log.text}</p>
                        {log.data && log.data.length > 0 && (
                          <div className="overflow-x-auto bg-slate-950 p-2 rounded border border-slate-850 text-[10px] my-1">
                            <table className="w-full text-left text-slate-400 border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]">
                                  {Object.keys(log.data[0]).slice(0, 4).map((key, kIdx) => (
                                    <th key={kIdx} className="pb-1 pr-3">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900">
                                {log.data.slice(0, 5).map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {Object.keys(row).slice(0, 4).map((key, cIdx) => (
                                      <td key={cIdx} className="py-1 pr-3 max-w-[120px] truncate">
                                        {String(row[key])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {log.data.length > 5 && (
                              <p className="text-[9px] text-slate-500 italic mt-1">... and {log.data.length - 5} more rows.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Preloaded quick script tags */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase mr-1">Quick Presets:</span>
                {[
                  { label: 'Select Customers', q: 'SELECT * FROM customers;' },
                  { label: 'Select Jobs', q: 'SELECT * FROM jobs;' },
                  { label: 'Activate All Clients', q: "UPDATE customers SET status = 'Active';" },
                  { label: 'Standby All Contractors', q: 'UPDATE contractors SET isAvailable = true;' },
                  { label: 'Clear Alarms Backlog', q: 'DELETE FROM jobs;' },
                  { label: 'Insert President Audit', q: 'INSERT INTO enquiries' }
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => { setSqlQuery(preset.q); executeSql(preset.q); }}
                    className="text-[9.5px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded text-slate-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* CLI command entry row */}
              <form 
                onSubmit={(e) => { e.preventDefault(); executeSql(sqlQuery); }}
                className="flex gap-2"
              >
                <div className="flex-1 bg-black rounded-lg border border-slate-700 flex items-center px-3 gap-2">
                  <span className="text-red font-bold text-xs select-none">sda_db=&gt;</span>
                  <input 
                    type="text" 
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter query (e.g. SELECT * FROM customers;) or 'clear'"
                    className="flex-1 bg-transparent text-xs text-green-300 border-none outline-none focus:ring-0 py-2 font-mono focus:outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-red hover:bg-red/90 text-white font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>RUN</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
