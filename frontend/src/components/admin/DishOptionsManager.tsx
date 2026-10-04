'use client';

import { useState } from 'react';
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';

type Option = { id: number; name: string; costPrice: number; isActive: boolean };
type Group = { id: number; name: string; isRequired: boolean; displayOrder: number; options: { id: number; option: Option }[] };

async function getRequestError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  const message = payload && typeof payload.message === 'string'
    ? payload.message
    : Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : '';
  return new Error(message || fallback);
}

export default function DishOptionsManager({ dish, initialOptions, tierId }: { dish: any; initialOptions: Option[]; tierId?: number }) {
  const canEditSharedOptions = !tierId;
  const options = Array.isArray(initialOptions) ? initialOptions : [];
  const [groups, setGroups] = useState<Group[]>(
    (Array.isArray(dish?.optionGroups) ? dish.optionGroups : []).map((group: any) => ({
      ...group,
      options: Array.isArray(group.options)
        ? group.options.filter((item: any) => item?.option)
        : [],
    })),
  );
  const [groupName, setGroupName] = useState('');
  const [groupRequired, setGroupRequired] = useState(false);
  const [newOption, setNewOption] = useState({ name: '', price: '' });
  const [selectedOption, setSelectedOption] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState({ name: '', costPrice: 0 });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [confirmGroup, setConfirmGroup] = useState<Group | null>(null);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setBusy('group');
    try {
      const response = await fetch(`/api/proxy/catalogue/dishes/${dish.id}/option-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          isRequired: groupRequired,
          displayOrder: groups.length + 1,
          ...(tierId ? { tierId } : {}),
        }),
      });
      if (!response.ok) throw await getRequestError(response, 'Could not create the option group');
      const createdGroup = await response.json();
      setGroups(current => [...current, { ...createdGroup, options: Array.isArray(createdGroup.options) ? createdGroup.options : [] }]);
      setGroupName('');
      setGroupRequired(false);
      setMessage('Option group created.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  };

  const deleteGroup = async (group: Group) => {
    setBusy(`delete-group-${group.id}`);
    try {
      const response = await fetch(`/api/proxy/catalogue/dishes/${dish.id}/option-groups/${group.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw await getRequestError(response, 'Could not delete the option group');
      setGroups(current => current.filter(item => item.id !== group.id));
      setConfirmGroup(null);
      setMessage('Option group deleted.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  };

  const attachOption = async (group: Group, optionId: number) => {
    if (!optionId) return;
    setBusy(`attach-${group.id}`);
    try {
      const response = await fetch(`/api/proxy/catalogue/dishes/${dish.id}/option-groups/${group.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, displayOrder: group.options.length + 1 }),
      });
      if (!response.ok) throw await getRequestError(response, 'Could not attach option');
      const option = options.find(item => item.id === optionId);
      if (option) {
        setGroups(current => current.map(item => item.id === group.id
          ? { ...item, options: [...item.options, { id: Date.now(), option }] }
          : item));
      }
      setSelectedOption(current => ({ ...current, [group.id]: '' }));
      setMessage('Option added to the group.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  };

  const createAndAttachOption = async (group: Group) => {
    if (!newOption.name.trim() || Number.isNaN(Number(newOption.price))) return;
    setBusy(`new-${group.id}`);
    try {
      const optionResponse = await fetch('/api/proxy/catalogue/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOption.name.trim(), costPrice: Math.round(Number(newOption.price) * 100) }),
      });
      if (!optionResponse.ok) throw await getRequestError(optionResponse, 'Could not create option');
      const option = await optionResponse.json();
      const attachedResponse = await fetch(`/api/proxy/catalogue/dishes/${dish.id}/option-groups/${group.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: option.id, displayOrder: group.options.length + 1 }),
      });
      if (!attachedResponse.ok) throw await getRequestError(attachedResponse, 'Could not attach the new option');
      setGroups(current => current.map(item => item.id === group.id
        ? { ...item, options: [...item.options, { id: Date.now(), option }] }
        : item));
      setMessage('New option created and added to the group.');
      setNewOption({ name: '', price: '' });
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  };

  const saveOption = async (optionId: number) => {
    setBusy(`save-${optionId}`);
    const response = await fetch(`/api/proxy/catalogue/options/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingValues.name, costPrice: editingValues.costPrice }),
    });
    if (response.ok) {
      setGroups(current => current.map(group => ({
        ...group,
        options: group.options.map(item => item.option.id === optionId
          ? { ...item, option: { ...item.option, ...editingValues } }
          : item),
      })));
      setEditingId(null);
      setMessage('Option updated.');
    }
    setBusy('');
  };

  const deactivateOption = async (optionId: number) => {
    setBusy(`remove-${optionId}`);
    const response = await fetch(`/api/proxy/catalogue/options/${optionId}/deactivate`, { method: 'PATCH' });
    if (response.ok) {
      setGroups(current => current.map(group => ({
        ...group,
        options: group.options.filter(item => item.option.id !== optionId),
      })));
      setMessage('Option deactivated.');
    }
    setBusy('');
  };

  const availableOptions = (group: Group) => options.filter(option =>
    option.isActive && !group.options.some(item => item.option.id === option.id),
  );

  return (
    <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Option groups for {dish.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Create groups such as Protein or Rice, then choose the options available in each group.</p>
          </div>
          {message && <span style={{ color: 'var(--primary-hover)', fontSize: '0.82rem' }}>{message}</span>}
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'grid', gap: '18px' }}>
        {groups.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No option groups yet. Create the first group below.</p>}
        {[...groups].sort((a, b) => a.displayOrder - b.displayOrder).map(group => (
          <section key={group.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong>{group.name}</strong>
                <span style={{ marginLeft: '8px', fontSize: '.74rem', color: group.isRequired ? '#b91c1c' : 'var(--text-muted)' }}>
                  {group.isRequired ? 'Required' : 'Optional'}
                </span>
              </div>
              <button
                className="btn-secondary"
                type="button"
                disabled={busy === `delete-group-${group.id}`}
                onClick={() => setConfirmGroup(group)}
                style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '6px 10px' }}
              >
                <Trash2 size={14} /> Delete group
              </button>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {group.options.map(item => editingId === item.option.id ? (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto', gap: '8px' }}>
                  <input className="input-field" value={editingValues.name} onChange={event => setEditingValues({ ...editingValues, name: event.target.value })} />
                  <input className="input-field" type="number" step="0.01" value={(editingValues.costPrice / 100).toFixed(2)} onChange={event => setEditingValues({ ...editingValues, costPrice: Math.round(Number(event.target.value) * 100) })} />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-secondary icon-button" disabled={!!busy} onClick={() => saveOption(item.option.id)}><Check size={15} /></button>
                    <button className="btn-secondary icon-button" onClick={() => setEditingId(null)}><X size={15} /></button>
                  </div>
                </div>
              ) : (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600 }}>{item.option.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>${(item.option.costPrice / 100).toFixed(2)}</span>
                    {canEditSharedOptions && <button className="btn-secondary icon-button" onClick={() => { setEditingId(item.option.id); setEditingValues({ name: item.option.name, costPrice: item.option.costPrice }); }}><Edit3 size={15} /></button>}
                    {canEditSharedOptions && <button className="btn-secondary icon-button" disabled={busy === `remove-${item.option.id}`} onClick={() => deactivateOption(item.option.id)}><Trash2 size={15} /></button>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '12px' }}>
              <select className="input-field" value={selectedOption[group.id] || ''} onChange={event => setSelectedOption(current => ({ ...current, [group.id]: event.target.value }))}>
                <option value="">Attach an existing option...</option>
                {availableOptions(group).map(option => <option key={option.id} value={option.id}>{option.name} (+${(option.costPrice / 100).toFixed(2)})</option>)}
              </select>
              <button className="btn-secondary" disabled={!selectedOption[group.id] || !!busy} onClick={() => attachOption(group, Number(selectedOption[group.id]))}><Plus size={15} /> Attach</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto', gap: '8px', marginTop: '8px' }}>
              <input className="input-field" placeholder="Create new option" value={newOption.name} onChange={event => setNewOption({ ...newOption, name: event.target.value })} />
              <input className="input-field" type="number" step="0.01" min="0" placeholder="Price" value={newOption.price} onChange={event => setNewOption({ ...newOption, price: event.target.value })} />
              <button className="btn-secondary" disabled={!!busy} onClick={() => createAndAttachOption(group)}><Plus size={15} /> New</button>
            </div>
          </section>
        ))}
      </div>

      <div style={{ padding: '18px 24px', background: 'var(--bg-light)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
          <input className="input-field" placeholder="New group name" value={groupName} onChange={event => setGroupName(event.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Selection</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="group-selection" checked={groupRequired} onChange={() => setGroupRequired(true)} /> Required
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="group-selection" checked={!groupRequired} onChange={() => setGroupRequired(false)} /> Optional
            </label>
          </div>
          <button className="btn-primary" disabled={busy === 'group'} onClick={createGroup}><Plus size={15} /> Add group</button>
        </div>
      </div>

      {confirmGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.45)' }} onClick={() => setConfirmGroup(null)} />
          <div className="premium-card" style={{ position: 'relative', zIndex: 1001, width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>Delete option group?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              “{confirmGroup.name}” and its attached options will be removed from this dish.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" type="button" onClick={() => setConfirmGroup(null)}>Cancel</button>
              <button className="btn-primary" type="button" disabled={busy === `delete-group-${confirmGroup.id}`} onClick={() => deleteGroup(confirmGroup)} style={{ background: '#b91c1c' }}>
                {busy === `delete-group-${confirmGroup.id}` ? 'Deleting...' : 'Delete group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
