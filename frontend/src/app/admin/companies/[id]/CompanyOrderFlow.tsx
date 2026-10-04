'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ChevronLeft, AlertCircle, Search, Plus, Minus, User, Check, Utensils, X, Star } from 'lucide-react';
import { buildDecoratedItem } from '@/lib/CartDecorator';

export default function CompanyOrderFlow({ company, catalogue, settings }: { company: any; catalogue: any[]; settings: any }) {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(company.defaultDeliveryTime || '12:00');
  const [minDateStr, setMinDateStr] = useState('');
  const [activeDish, setActiveDish] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All dishes');
  const [addedDishIds, setAddedDishIds] = useState<Record<number, number>>({});

  useEffect(() => {
    const cutoffDays = settings.cutoff_days_before ?? 2;
    const workingDays = settings.kitchen_working_days ?? [1, 2, 3, 4, 5];
    const date = new Date();
    let daysAdded = 0;
    while (daysAdded < cutoffDays) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      if (workingDays.includes(dayOfWeek)) daysAdded++;
    }
    setMinDateStr(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }, [settings]);

  const filteredCatalogue = useMemo(() => {
    const categoryFiltered = activeCategory === 'All dishes'
      ? catalogue
      : catalogue.filter((d: any) => (d.category || d.station?.name || (d.temperature === 'COLD' ? 'Cold kitchen' : 'Hot kitchen')) === activeCategory);
    if (!searchQuery) return categoryFiltered;
    const q = searchQuery.toLowerCase();
    return categoryFiltered.filter((d: any) => d.name.toLowerCase().includes(q) || d.sku?.toLowerCase().includes(q));
  }, [catalogue, searchQuery, activeCategory]);

  const categories = useMemo(() => {
    const names = catalogue.map((d: any) => d.category || d.station?.name || (d.temperature === 'COLD' ? 'Cold kitchen' : 'Hot kitchen'));
    return ['All dishes', ...Array.from(new Set(names))];
  }, [catalogue]);

  const handleDishClick = (dish: any) => {
    setActiveDish(dish);
    setSelectedOptions({});
    setQuantity(1);
  };

  const addToCart = () => {
    if (!activeDish) return;
    for (const group of activeDish.optionGroups || []) {
      if (group.isRequired && !selectedOptions[group.id]) {
        alert(`Please select an option for "${group.name}"`);
        return;
      }
    }

    const flatOptions: { groupName: string; optionName: string; price: number }[] = [];
    Object.entries(selectedOptions).forEach(([groupId, val]: any) => {
      const group = activeDish.optionGroups?.find((g: any) => g.id === Number(groupId));
      if (Array.isArray(val)) {
        val.forEach((v: any) => flatOptions.push({ groupName: group?.name || '', optionName: v.name, price: v.finalPrice }));
      } else {
        flatOptions.push({ groupName: group?.name || '', optionName: val.name, price: val.finalPrice });
      }
    });

    const newItems = Array.from({ length: quantity }).map(() => ({
      id: crypto.randomUUID(),
      dish: activeDish,
      selectedOptions: flatOptions,
      employeeId: '',
    }));

    setCart([...cart, ...newItems]);
    setAddedDishIds(current => ({ ...current, [activeDish.id]: (current[activeDish.id] || 0) + quantity }));
    setActiveDish(null);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));
  const updateCartEmployee = (id: string, empId: string) => setCart(cart.map(c => c.id === id ? { ...c, employeeId: empId } : c));
  const assignAllToEmployee = (empId: string) => setCart(cart.map(c => ({ ...c, employeeId: empId })));

  const cartTotal = cart.reduce((sum, c) => {
    const decorated = buildDecoratedItem(c.dish, c.selectedOptions);
    return sum + decorated.getPrice();
  }, 0);

  const handleSubmit = async (status: 'DRAFT' | 'PLACED') => {
    if (!deliveryDate) { setError('Please select a delivery date.'); return; }
    if (deliveryDate < minDateStr) { setError(`Delivery date must be on or after ${minDateStr} due to cut-off rules.`); return; }
    const unassigned = cart.find(c => !c.employeeId);
    if (unassigned) { setError('Please assign an employee to every dish in the cart.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const grouped = cart.reduce((acc: any, item: any) => {
        if (!acc[item.employeeId]) acc[item.employeeId] = [];
        acc[item.employeeId].push(item);
        return acc;
      }, {});

      const promises = Object.entries(grouped).map(async ([empId, items]: [string, any]) => {
        const linesMap = new Map<string, any>();
        items.forEach((item: any) => {
          const decorated = buildDecoratedItem(item.dish, item.selectedOptions);
          const optionsKey = decorated.getOptions().map((o: any) => o.optionName).sort().join('|');
          const key = `${item.dish.id}-${optionsKey}`;

          if (linesMap.has(key)) {
            linesMap.get(key).combinations[0].quantity += 1;
          } else {
            linesMap.set(key, {
              dishId: item.dish.id,
              dishName: item.dish.name,
              dishSku: item.dish.sku,
              unitPrice: decorated.getPrice(),
              combinations: [{
                quantity: 1,
                options: decorated.getOptions().map((opt: any) => ({
                  optionGroupName: opt.groupName,
                  optionName: opt.optionName,
                  optionPrice: opt.price,
                })),
              }],
            });
          }
        });

        const body = {
          employeeId: parseInt(empId),
          deliveryDate,
          deliveryTime,
          status,
          lines: Array.from(linesMap.values()),
        };

        const res = await fetch('/api/proxy/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Failed to place order for employee ID ${empId}`);
      });

      await Promise.all(promises);
      router.push('/admin/orders');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin/companies')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          <ChevronLeft size={14} /> Companies
        </button>
        <button onClick={() => router.push(`/admin/companies/${company.id}/details`)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Company Details
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', fontSize: '1.65rem' }}>Create Order</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ordering for <strong style={{ color: 'var(--primary)' }}>{company.name}</strong></p>
        </div>
      </div>

      {step === 1 ? (
        /* ====== STEP 1: MENU BROWSING ====== */
        <>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text" placeholder="Search dishes..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field" style={{ paddingLeft: '36px', padding: '10px 14px 10px 36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
            <aside className="menu-category-rail">
              <div className="menu-category-label">Menu</div>
              {categories.map(category => (
                <button key={category} className={activeCategory === category ? 'menu-category active' : 'menu-category'} onClick={() => setActiveCategory(category)}>
                  <span>{category}</span>
                  <small>{category === 'All dishes' ? catalogue.length : catalogue.filter((d: any) => (d.category || d.station?.name || (d.temperature === 'COLD' ? 'Cold kitchen' : 'Hot kitchen')) === category).length}</small>
                </button>
              ))}
            </aside>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCatalogue.map((dish: any) => (
              <div key={dish.id}>
              <div className="premium-card" onClick={() => handleDishClick(dish)}
                style={{ cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  marginLeft: 'auto',
                  background: dish.temperature === 'HOT' ? '#fef3c7' : '#e0f2fe',
                  color: dish.temperature === 'HOT' ? '#d97706' : '#0284c7',
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                }}>
                  {dish.temperature}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#059669', flexShrink: 0,
                  }}>
                    <Utensils size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '2px', lineHeight: 1.3 }}>{dish.name}</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{dish.sku}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.15rem' }}>
                    ${(dish.finalPrice / 100).toFixed(2)}
                  </span>
                  <span style={{ color: addedDishIds[dish.id] ? '#047857' : 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                  {addedDishIds[dish.id] ? <><Check size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Added {addedDishIds[dish.id]}</> : <><Plus size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Add</>}
                  </span>
                </div>
              </div>
              {activeDish?.id === dish.id && (
                <div className="premium-card" style={{ marginTop: '4px', padding: '18px 20px', background: '#f8fffc', borderColor: '#a7f3d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <strong>Choose options</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>Select the add-ons for this dish, then set the quantity.</p>
                    </div>
                    <button className="btn-secondary icon-button" onClick={() => setActiveDish(null)}><X size={15} /></button>
                  </div>
                  {dish.optionGroups?.map((group: any) => (
                    <div key={group.id} style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', marginBottom: '6px' }}>Available options</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {group.options.map((opt: any) => {
                          const isChecked = group.isRequired
                            ? selectedOptions[group.id]?.id === opt.id
                            : selectedOptions[group.id]?.some((item: any) => item.id === opt.id);
                          return (
                            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', border: `1px solid ${isChecked ? '#10b981' : 'var(--border)'}`, background: isChecked ? '#ecfdf5' : 'white', borderRadius: '8px', fontSize: '0.82rem' }}>
                              <input type={group.isRequired ? 'radio' : 'checkbox'} name={`inline-group-${group.id}`} checked={isChecked}
                                onChange={e => {
                                  if (group.isRequired) setSelectedOptions({ ...selectedOptions, [group.id]: opt });
                                  else {
                                    const current = selectedOptions[group.id] || [];
                                    setSelectedOptions({ ...selectedOptions, [group.id]: e.target.checked ? [...current, opt] : current.filter((item: any) => item.id !== opt.id) });
                                  }
                                }} />
                              {opt.name}{opt.finalPrice > 0 ? ` +$${(opt.finalPrice / 100).toFixed(2)}` : ''}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #d1fae5', paddingTop: '14px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Qty</label>
                    <input className="input-field" type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} style={{ width: '72px', padding: '8px' }} />
                    <button className="btn-primary" onClick={addToCart}><ShoppingCart size={15} /> Add to cart</button>
                  </div>
                </div>
              )}
              </div>
            ))}
            </div>
          </div>

          {filteredCatalogue.length === 0 && (
            <div className="premium-card" style={{ textAlign: 'center', padding: '60px' }}>
              <Utensils size={48} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
              <h3>No dishes available</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No dishes found for this company&apos;s price tier.</p>
            </div>
          )}
          {step === 1 && cart.length > 0 && (
            <button className="floating-cart-button" onClick={() => setStep(2)}>
              <ShoppingCart size={18} />
              <span>View cart</span>
              <strong>{cart.length}</strong>
              <b>${(cartTotal / 100).toFixed(2)}</b>
            </button>
          )}
        </>
      ) : (
        /* ====== STEP 2: CHECKOUT & EMPLOYEE ASSIGNMENT ====== */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'start' }}>
          {/* Left: Cart Items with Employee Assignment */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Assign Employees to Dishes</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {company.employees?.length > 0 && (
                  <select className="input-field"
                    style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
                    onChange={e => { if (e.target.value) assignAllToEmployee(e.target.value); }}
                    defaultValue=""
                  >
                    <option value="">Assign all to...</option>
                    {company.employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                )}
                <button className="btn-secondary" onClick={() => setStep(1)} style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                  <Plus size={12} /> Add More
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item, idx) => {
                const decorated = buildDecoratedItem(item.dish, item.selectedOptions);
                const assignedEmp = company.employees?.find((e: any) => String(e.id) === String(item.employeeId));
                return (
                  <div key={item.id} className="premium-card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{item.dish.name}</p>
                          {item.selectedOptions.map((opt: any, i: number) => (
                            <span key={i} style={{
                              display: 'inline-block', fontSize: '0.72rem', padding: '1px 6px',
                              background: '#f1f5f9', borderRadius: '4px', marginRight: '4px', color: 'var(--text-muted)',
                            }}>
                              + {opt.optionName}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>${(decorated.getPrice() / 100).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.id)} style={{
                            background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px',
                          }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Employee Assignment */}
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <select
                          className="input-field"
                          value={item.employeeId}
                          onChange={e => updateCartEmployee(item.id, e.target.value)}
                          style={{
                            padding: '6px 10px', fontSize: '0.82rem', flex: 1,
                            borderColor: !item.employeeId ? '#fecaca' : 'var(--border)',
                            appearance: 'auto',
                          }}
                        >
                          <option value="">— Select Employee —</option>
                          {company.employees?.map((emp: any) => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                          ))}
                        </select>
                        {assignedEmp && (
                          <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Checkout Summary */}
          <div className="premium-card" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Order Summary</h3>

            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items</span>
                <span style={{ fontWeight: 600 }}>{cart.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>${(cartTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Delivery Date *</label>
                <input type="date" min={minDateStr} className="input-field" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Delivery Time</label>
                <input type="time" className="input-field" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '0.85rem',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-primary" onClick={() => handleSubmit('PLACED')} disabled={submitting || cart.length === 0}
                style={{ justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
                {submitting ? 'Placing...' : '🚀 Place Order'}
              </button>
              <button className="btn-secondary" onClick={() => handleSubmit('DRAFT')} disabled={submitting || cart.length === 0}
                style={{ justifyContent: 'center', padding: '10px' }}>
                💾 Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
