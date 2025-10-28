import express from 'express';
import db from '../db.js';

const router = express.Router();

// =========================
// GET all reconstruction projects
// =========================
router.get('/', async (req, res) => {
    try {
        const projects = await db.all(`
            SELECT rr.*, wo.client AS client_id, c.name AS client_name
            FROM remediation_reconstruction rr
            LEFT JOIN work_orders wo ON rr.work_order_id = wo.id
            LEFT JOIN clients c ON wo.client = c.id
            ORDER BY rr.created_at DESC
        `);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// GET single reconstruction project with full details
// =========================
router.get('/:id', async (req, res) => {
    try {
        const project = await db.get(`
            SELECT rr.*, wo.client AS client_id, c.name AS client_name, c.address, c.phone, c.email
            FROM remediation_reconstruction rr
            LEFT JOIN work_orders wo ON rr.work_order_id = wo.id
            LEFT JOIN clients c ON wo.client = c.id
            WHERE rr.id = ?
        `, req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Reconstruction project not found' });
        }

        // Get daily logs
        const dailyLogs = await db.all(`
            SELECT * FROM daily_project_logs 
            WHERE project_id = ? AND project_type = 'reconstruction' 
            ORDER BY log_date DESC
        `, req.params.id);

        // Get photos (placeholder - assuming you'll implement later)
        const photos = await db.all(`
            SELECT * FROM project_photos 
            WHERE project_id = ? AND project_type = 'reconstruction' 
            ORDER BY taken_date
        `, req.params.id);

        // Get linked dryout project if exists
        let dryoutProject = null;
        if (project.dryout_id) {
            dryoutProject = await db.get('SELECT * FROM remediation_dryout WHERE id = ?', project.dryout_id);
        }

        res.json({
            project,
            daily_logs: dailyLogs,
            photos,
            dryout_project: dryoutProject
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// CREATE new reconstruction project
// =========================
router.post('/', async (req, res) => {
    try {
        const {
            work_order_id,
            dryout_id,
            project_number,
            project_name,
            project_description,
            reconstruction_type,
            insurance_carrier,
            claim_number,
            adjuster_name,
            xactimate_estimate_number
        } = req.body;

        if (!work_order_id) {
            return res.status(400).json({ error: 'Work order ID is required' });
        }

        const result = await db.run(`
            INSERT INTO remediation_reconstruction (
                work_order_id, dryout_id, project_number, project_name, project_description,
                reconstruction_type, insurance_carrier, claim_number, adjuster_name,
                xactimate_estimate_number, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Planning')
        `, [
            work_order_id,
            dryout_id || null,
            project_number || `RECON-${Date.now()}`,
            project_name,
            project_description,
            reconstruction_type || 'Water',
            insurance_carrier,
            claim_number,
            adjuster_name,
            xactimate_estimate_number
        ]);

        const newProject = await db.get('SELECT * FROM remediation_reconstruction WHERE id = ?', result.lastID);
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// UPDATE reconstruction project (Full scope)
// =========================
router.put('/:id', async (req, res) => {
    try {
        const project = await db.get('SELECT * FROM remediation_reconstruction WHERE id = ?', req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Reconstruction project not found' });
        }

        const updates = req.body;
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                fields.push(`${key} = ?`);
                // Handle JSON fields
                if (['materials_list', 'labor_breakdown', 'subcontractor_list', 'punch_list', 'paint_color_scheme', 'permits_required', 'inspections_passed'].includes(key)) {
                    values.push(typeof updates[key] === 'string' ? updates[key] : JSON.stringify(updates[key]));
                } else {
                    values.push(updates[key]);
                }
            }
        });

        values.push(req.params.id);

        await db.run(`
            UPDATE remediation_reconstruction 
            SET ${fields.join(', ')}, updated_at = datetime('now')
            WHERE id = ?
        `, values);

        const updatedProject = await db.get('SELECT * FROM remediation_reconstruction WHERE id = ?', req.params.id);
        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// GENERATE COMPREHENSIVE SCOPE OF WORK (Insurance/Xactimate Format)
// =========================
router.get('/:id/detailed-scope', async (req, res) => {
    try {
        const project = await db.get('SELECT * FROM remediation_reconstruction WHERE id = ?', req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const scope = {
            project_info: {
                project_number: project.project_number,
                project_name: project.project_name,
                reconstruction_type: project.reconstruction_type,
                claim_number: project.claim_number,
                insurance_carrier: project.insurance_carrier,
                adjuster: project.adjuster_name,
                xactimate_estimate: project.xactimate_estimate_number
            },

            // --- ALL TRADE BREAKDOWNS ---

            demolition_phase: {
                status: project.demolition_complete ? 'Complete' : 'Pending',
                flooring: {
                    carpet: `${project.carpet_demo_sqft || 0} SF @ $${project.carpet_demo_rate || 0}/SF`,
                    pad: `${project.pad_demo_sqft || 0} SF @ $${project.pad_demo_rate || 0}/SF`,
                    tile: `${project.tile_demo_sqft || 0} SF @ $${project.tile_demo_rate || 0}/SF`,
                    hardwood: `${project.hardwood_demo_sqft || 0} SF @ $${project.hardwood_demo_rate || 0}/SF`
                },
                walls_ceilings: {
                    drywall: `${project.drywall_demo_sqft || 0} SF @ $${project.drywall_demo_rate || 0}/SF`,
                    insulation: `${project.insulation_demo_sqft || 0} SF`,
                    baseboard: `${project.baseboard_demo_lf || 0} LF @ $${project.baseboard_demo_rate || 0}/LF`
                },
                cabinets_fixtures: {
                    base_cabinets: `${project.base_cabinets_demo_lf || 0} LF`,
                    upper_cabinets: `${project.upper_cabinets_demo_lf || 0} LF`,
                    plumbing_fixtures: project.plumbing_fixture_demo || 'N/A'
                }
            },

            framing_structural: {
                wall_framing: `${project.wall_framing_lf || 0} LF @ $${project.wall_framing_rate || 0}/LF`,
                ceiling_framing: `${project.ceiling_framing_sqft || 0} SF`,
                subfloor_repair: `${project.subfloor_repair_sqft || 0} SF`
            },

            plumbing: {
                rough_in: project.plumbing_rough_in || 'Standard rough-in',
                water_lines: `${project.water_lines_installed_lf || 0} LF installed`,
                drain_lines: `${project.drain_lines_installed_lf || 0} LF installed`,
                toilet_install: `${project.toilet_install_qty || 0} installed @ $${project.toilet_cost_ea || 0}/ea`,
                sink_install: `${project.sink_install_qty || 0} installed @ $${project.sink_cost_ea || 0}/ea`,
                faucet_install: `${project.faucet_install_qty || 0} installed`,
                water_heaters: `${project.water_heater_install_qty || 0} installed`
            },

            electrical: {
                description: project.electrical_rough_in || 'Standard rough-in',
                outlets: `${project.outlets_installed_qty || 0} installed`,
                switches: `${project.switches_installed_qty || 0} installed`,
                light_fixtures: `${project.light_fixtures_qty || 0} installed`,
                gfci_outlets: `${project.gfci_outlets_qty || 0} installed`,
                panel_work: project.electrical_panel_work || 'None'
            },

            hvac: {
                description: project.hvac_work_description || 'None',
                ductwork: `${project.ductwork_installed_lf || 0} LF`,
                vents: `${project.vents_installed_qty || 0} installed`,
                returns: `${project.returns_installed_qty || 0} installed`
            },

            insulation: {
                batt: `${project.batt_insulation_install_sqft || 0} SF @ ${project.batt_insulation_rate || 0}/SF`,
                blown: `${project.blown_insulation_install_sqft || 0} SF`,
                spray_foam: `${project.spray_foam_install_sqft || 0} SF`
            },

            drywall: {
                hang: `${project.drywall_hang_sqft || 0} SF @ ${project.drywall_hang_rate || 0}/SF`,
                finish: `${project.drywall_finish_sqft || 0} SF @ ${project.drywall_finish_rate || 0}/SF`,
                texture: `${project.drywall_texture_sqft || 0} SF - ${project.drywall_texture_type || 'Standard'}`,
                corner_bead: `${project.corner_bead_lf || 0} LF`
            },

            ceiling: {
                drywall_hang: `${project.ceiling_drywall_hang_sqft || 0} SF`,
                texture: `${project.ceiling_texture_sqft || 0} SF - ${project.ceiling_texture_type || 'Standard'}`,
                drop_ceiling: `${project.drop_ceiling_install_sqft || 0} SF`
            },

            painting: {
                primer_walls: `${project.primer_walls_sqft || 0} SF @ ${project.primer_rate || 0}/SF`,
                paint_walls: `${project.paint_walls_sqft || 0} SF @ ${project.paint_walls_rate || 0}/SF (${project.paint_walls_coats || 2} coats)`,
                paint_ceiling: `${project.paint_ceiling_sqft || 0} SF @ ${project.paint_ceiling_rate || 0}/SF`,
                paint_trim: `${project.paint_trim_lf || 0} LF`,
                paint_doors: `${project.paint_doors_qty || 0} doors`,
                color_scheme: project.paint_color_scheme ? JSON.parse(project.paint_color_scheme) : {}
            },

            trim_millwork: {
                baseboard: `${project.baseboard_install_lf || 0} LF (${project.baseboard_type || 'Standard'}) @ ${project.baseboard_rate || 0}/LF`,
                crown_molding: `${project.crown_molding_install_lf || 0} LF @ ${project.crown_molding_rate || 0}/LF`,
                door_casing: `${project.door_casing_install_qty || 0} sets`,
                window_casing: `${project.window_casing_install_qty || 0} sets`,
                wainscoting: `${project.wainscoting_install_sqft || 0} SF`,
                chair_rail: `${project.chair_rail_install_lf || 0} LF`
            },

            doors_windows: {
                interior_doors: `${project.interior_door_install_qty || 0} (${project.interior_door_type || 'Standard'}) @ ${project.interior_door_cost_ea || 0}/ea`,
                exterior_doors: `${project.exterior_door_install_qty || 0} @ ${project.exterior_door_cost_ea || 0}/ea`,
                windows: `${project.window_install_qty || 0} (${project.window_type || 'Standard'}) @ ${project.window_cost_ea || 0}/ea`,
                sliding_doors: `${project.sliding_door_install_qty || 0} installed`
            },

            flooring: {
                carpet: {
                    install: `${project.carpet_install_sqft || 0} SF`,
                    type: project.carpet_type || 'Standard',
                    rate: `${project.carpet_rate || 0}/SF`,
                    pad: `${project.pad_install_sqft || 0} SF (${project.pad_type || 'Standard'}) @ ${project.pad_rate || 0}/SF`
                },
                tile: {
                    install: `${project.tile_install_sqft || 0} SF`,
                    type: project.tile_type || 'Ceramic',
                    size: project.tile_size || '12x12',
                    rate: `${project.tile_rate || 0}/SF`,
                    grout_color: project.grout_color || 'Standard'
                },
                hardwood: {
                    install: `${project.hardwood_install_sqft || 0} SF`,
                    type: project.hardwood_type || 'Oak',
                    finish: project.hardwood_finish || 'Natural',
                    rate: `${project.hardwood_rate || 0}/SF`
                },
                laminate: {
                    install: `${project.laminate_install_sqft || 0} SF`,
                    type: project.laminate_type || 'Standard',
                    rate: `${project.laminate_rate || 0}/SF`
                },
                vinyl: {
                    install: `${project.vinyl_install_sqft || 0} SF`,
                    type: project.vinyl_type || 'LVP',
                    rate: `${project.vinyl_rate || 0}/SF`
                },
                accessories: {
                    transition_strips: `${project.transition_strips_qty || 0} pieces`,
                    floor_prep: `${project.floor_prep_sqft || 0} SF`,
                    subfloor_repair: `${project.subfloor_repair_sqft || 0} SF`
                }
            },

            tile_work: {
                wall_tile: `${project.wall_tile_install_sqft || 0} SF (${project.wall_tile_type || 'Standard'}) @ ${project.wall_tile_rate || 0}/SF`,
                backsplash: `${project.backsplash_install_sqft || 0} SF (${project.backsplash_type || 'Standard'})`,
                shower_tile: `${project.shower_tile_sqft || 0} SF`,
                tub_surround: `${project.tub_surround_sqft || 0} SF`
            },

            cabinetry_countertops: {
                base_cabinets: `${project.base_cabinets_install_lf || 0} LF (${project.base_cabinet_type || 'Stock'}) @ ${project.base_cabinet_cost_lf || 0}/LF`,
                upper_cabinets: `${project.upper_cabinets_install_lf || 0} LF @ ${project.upper_cabinet_cost_lf || 0}/LF`,
                hardware: `${project.cabinet_hardware || 'Standard'} - ${project.hardware_cost || 0}`,
                countertop: `${project.countertop_install_lf || 0} LF (${project.countertop_material || 'Laminate'}) @ ${project.countertop_cost_lf || 0}/LF`,
                backsplash_height: `${project.backsplash_height || 4} inches`,
                vanity: `${project.vanity_install_qty || 0} units (${project.vanity_size || 'Standard'}) @ ${project.vanity_cost_ea || 0}/ea`,
                vanity_top: `${project.vanity_top_material || 'Standard'} @ ${project.vanity_top_cost_ea || 0}/ea`
            },

            specialty_work: {
                shower_pan: `${project.shower_pan_install_qty || 0} installed`,
                shower_door: `${project.shower_door_install_qty || 0} (${project.shower_door_type || 'Standard'})`,
                tub: `${project.tub_install_qty || 0} (${project.tub_type || 'Standard'}) @ ${project.tub_cost_ea || 0}/ea`
            },

            final_touches: {
                caulking: project.caulking_complete ? 'Complete' : 'Pending',
                touch_up_paint: project.touch_up_paint_complete ? 'Complete' : 'Pending',
                final_clean: project.final_clean_complete ? 'Complete' : 'Pending',
                punch_list: project.punch_list ? JSON.parse(project.punch_list) : []
            },

            // --- PROJECT MANAGEMENT & FINANCIALS ---

            permits_inspections: {
                permits_required: project.permits_required ? JSON.parse(project.permits_required) : [],
                permit_numbers: project.permit_numbers || 'N/A',
                inspections: project.inspections_passed ? JSON.parse(project.inspections_passed) : {},
                final_inspection: project.final_inspection_date || 'Pending',
                certificate_of_occupancy: project.certificate_of_occupancy ? 'Issued' : 'Pending'
            },

            labor_tracking: {
                breakdown: project.labor_breakdown ? JSON.parse(project.labor_breakdown) : [],
                hours_by_trade: {
                    general_contractor: project.general_contractor_hours || 0,
                    carpenter: project.carpenter_hours || 0,
                    electrician: project.electrician_hours || 0,
                    plumber: project.plumber_hours || 0,
                    hvac_tech: project.hvac_tech_hours || 0,
                    drywall_hanger: project.drywall_hanger_hours || 0,
                    taper: project.taper_hours || 0,
                    painter: project.painter_hours || 0,
                    tile_setter: project.tile_setter_hours || 0,
                    flooring_installer: project.flooring_installer_hours || 0
                }
            },

            subcontractors: project.subcontractor_list ? JSON.parse(project.subcontractor_list) : [],

            timeline: {
                demo_start: project.demo_start_date,
                demo_complete: project.demo_completion_date,
                reconstruction_start: project.reconstruction_start_date,
                substantial_completion: project.substantial_completion_date,
                final_completion: project.final_completion_date,
                total_days: project.total_project_days || 'TBD'
            },

            cost_breakdown: {
                demolition: `${(project.total_demo_cost || 0).toFixed(2)}`,
                materials: `${(project.total_material_cost || 0).toFixed(2)}`,
                labor: `${(project.total_labor_cost || 0).toFixed(2)}`,
                subcontractors: `${(project.total_subcontractor_cost || 0).toFixed(2)}`,
                equipment: `${(project.total_equipment_cost || 0).toFixed(2)}`,
                permits: `${(project.total_permit_cost || 0).toFixed(2)}`,
                overhead: `${project.overhead_percentage || 10}%`,
                profit: `${project.profit_margin_percentage || 10}%`,
                change_orders: `${(project.change_orders_total || 0).toFixed(2)} (${project.change_orders_qty || 0} orders)`,
                estimated_total: `${(project.estimated_total || 0).toFixed(2)}`,
                actual_total: `${(project.actual_total || 0).toFixed(2)}`
            },

            quality_control: {
                client_walkthrough: project.client_walkthrough_date || 'Pending',
                satisfaction_score: project.client_satisfaction_score || 'N/A',
                warranty: `${project.warranty_period_months || 12} months - ${project.warranty_provided || 'Standard workmanship warranty'}`
            },

            status: {
                current_status: project.status,
                completion_certificate: project.completion_certificate || 'Pending',
                final_invoice_sent: project.final_invoice_sent ? 'Yes' : 'No',
                payment_received: project.payment_received ? 'Yes' : 'No'
            }
        };

        res.json(scope);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// GENERATE XACTIMATE-STYLE ESTIMATE (All line items)
// =========================
router.get('/:id/xactimate-estimate', async (req, res) => {
    try {
        const project = await db.get('SELECT * FROM remediation_reconstruction WHERE id = ?', req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const lineItems = [];

        // --- DEMOLITION LINE ITEMS ---
        if (project.carpet_demo_sqft > 0) {
            lineItems.push({ code: 'RMV-CARPT', category: 'Demolition', description: 'Remove carpet', qty: project.carpet_demo_sqft, unit: 'SF', rate: project.carpet_demo_rate, total: (project.carpet_demo_sqft * project.carpet_demo_rate).toFixed(2) });
        }
        if (project.pad_demo_sqft > 0) {
            lineItems.push({ code: 'RMV-PAD', category: 'Demolition', description: 'Remove carpet pad', qty: project.pad_demo_sqft, unit: 'SF', rate: project.pad_demo_rate, total: (project.pad_demo_sqft * project.pad_demo_rate).toFixed(2) });
        }
        if (project.tile_demo_sqft > 0) {
            lineItems.push({ code: 'RMV-TILE', category: 'Demolition', description: 'Remove floor tile', qty: project.tile_demo_sqft, unit: 'SF', rate: project.tile_demo_rate, total: (project.tile_demo_sqft * project.tile_demo_rate).toFixed(2) });
        }
        if (project.hardwood_demo_sqft > 0) {
            lineItems.push({ code: 'RMV-HDWD', category: 'Demolition', description: 'Remove hardwood flooring', qty: project.hardwood_demo_sqft, unit: 'SF', rate: project.hardwood_demo_rate, total: (project.hardwood_demo_sqft * project.hardwood_demo_rate).toFixed(2) });
        }
        if (project.drywall_demo_sqft > 0) {
            lineItems.push({ code: 'RMV-DRY', category: 'Demolition', description: 'Remove drywall', qty: project.drywall_demo_sqft, unit: 'SF', rate: project.drywall_demo_rate, total: (project.drywall_demo_sqft * project.drywall_demo_rate).toFixed(2) });
        }
        if (project.baseboard_demo_lf > 0) {
            lineItems.push({ code: 'RMV-BASE', category: 'Demolition', description: 'Remove baseboard', qty: project.baseboard_demo_lf, unit: 'LF', rate: project.baseboard_demo_rate, total: (project.baseboard_demo_lf * project.baseboard_demo_rate).toFixed(2) });
        }
        if (project.base_cabinets_demo_lf > 0) {
            lineItems.push({ code: 'RMV-BCAB', category: 'Demolition', description: 'Remove base cabinets', qty: project.base_cabinets_demo_lf, unit: 'LF', rate: 15.00, total: (project.base_cabinets_demo_lf * 15.00).toFixed(2) });
        }
        if (project.upper_cabinets_demo_lf > 0) {
            lineItems.push({ code: 'RMV-UCAB', category: 'Demolition', description: 'Remove upper cabinets', qty: project.upper_cabinets_demo_lf, unit: 'LF', rate: 12.00, total: (project.upper_cabinets_demo_lf * 12.00).toFixed(2) });
        }

        // --- FRAMING ---
        if (project.wall_framing_lf > 0) {
            lineItems.push({ code: 'FRM-WALL', category: 'Framing', description: 'Frame walls', qty: project.wall_framing_lf, unit: 'LF', rate: project.wall_framing_rate, total: (project.wall_framing_lf * project.wall_framing_rate).toFixed(2) });
        }

        // --- PLUMBING ---
        if (project.water_lines_installed_lf > 0) {
            lineItems.push({ code: 'PLM-WLINE', category: 'Plumbing', description: 'Install water lines', qty: project.water_lines_installed_lf, unit: 'LF', rate: 8.50, total: (project.water_lines_installed_lf * 8.50).toFixed(2) });
        }
        if (project.toilet_install_qty > 0) {
            lineItems.push({ code: 'PLM-TOIL', category: 'Plumbing', description: 'Install toilet', qty: project.toilet_install_qty, unit: 'EA', rate: project.toilet_cost_ea, total: (project.toilet_install_qty * project.toilet_cost_ea).toFixed(2) });
        }
        if (project.sink_install_qty > 0) {
            lineItems.push({ code: 'PLM-SINK', category: 'Plumbing', description: 'Install sink', qty: project.sink_install_qty, unit: 'EA', rate: project.sink_cost_ea, total: (project.sink_install_qty * project.sink_cost_ea).toFixed(2) });
        }

        // --- ELECTRICAL ---
        if (project.outlets_installed_qty > 0) {
            lineItems.push({ code: 'ELC-OUTL', category: 'Electrical', description: 'Install outlets', qty: project.outlets_installed_qty, unit: 'EA', rate: 75.00, total: (project.outlets_installed_qty * 75.00).toFixed(2) });
        }
        if (project.switches_installed_qty > 0) {
            lineItems.push({ code: 'ELC-SWTC', category: 'Electrical', description: 'Install switches', qty: project.switches_installed_qty, unit: 'EA', rate: 65.00, total: (project.switches_installed_qty * 65.00).toFixed(2) });
        }

        // --- INSULATION ---
        if (project.batt_insulation_install_sqft > 0) {
            lineItems.push({ code: 'INS-BATT', category: 'Insulation', description: 'Install batt insulation', qty: project.batt_insulation_install_sqft, unit: 'SF', rate: project.batt_insulation_rate, total: (project.batt_insulation_install_sqft * project.batt_insulation_rate).toFixed(2) });
        }

        // --- DRYWALL ---
        if (project.drywall_hang_sqft > 0) {
            lineItems.push({ code: 'DRY-HANG', category: 'Drywall', description: 'Hang drywall', qty: project.drywall_hang_sqft, unit: 'SF', rate: project.drywall_hang_rate, total: (project.drywall_hang_sqft * project.drywall_hang_rate).toFixed(2) });
        }
        if (project.drywall_finish_sqft > 0) {
            lineItems.push({ code: 'DRY-FIN', category: 'Drywall', description: 'Finish drywall', qty: project.drywall_finish_sqft, unit: 'SF', rate: project.drywall_finish_rate, total: (project.drywall_finish_sqft * project.drywall_finish_rate).toFixed(2) });
        }
        if (project.drywall_texture_sqft > 0) {
            lineItems.push({ code: 'DRY-TEX', category: 'Drywall', description: `Texture drywall - ${project.drywall_texture_type}`, qty: project.drywall_texture_sqft, unit: 'SF', rate: 0.85, total: (project.drywall_texture_sqft * 0.85).toFixed(2) });
        }

        // --- PAINTING ---
        if (project.primer_walls_sqft > 0) {
            lineItems.push({ code: 'PNT-PRIM', category: 'Painting', description: 'Prime walls', qty: project.primer_walls_sqft, unit: 'SF', rate: project.primer_rate, total: (project.primer_walls_sqft * project.primer_rate).toFixed(2) });
        }
        if (project.paint_walls_sqft > 0) {
            lineItems.push({ code: 'PNT-WALL', category: 'Painting', description: `Paint walls (${project.paint_walls_coats} coats)`, qty: project.paint_walls_sqft, unit: 'SF', rate: project.paint_walls_rate, total: (project.paint_walls_sqft * project.paint_walls_rate).toFixed(2) });
        }
        if (project.paint_ceiling_sqft > 0) {
            lineItems.push({ code: 'PNT-CEIL', category: 'Painting', description: 'Paint ceiling', qty: project.paint_ceiling_sqft, unit: 'SF', rate: project.paint_ceiling_rate, total: (project.paint_ceiling_sqft * project.paint_ceiling_rate).toFixed(2) });
        }

        // --- TRIM ---
        if (project.baseboard_install_lf > 0) {
            lineItems.push({ code: 'TRM-BASE', category: 'Trim', description: `Install baseboard - ${project.baseboard_type}`, qty: project.baseboard_install_lf, unit: 'LF', rate: project.baseboard_rate, total: (project.baseboard_install_lf * project.baseboard_rate).toFixed(2) });
        }
        if (project.crown_molding_install_lf > 0) {
            lineItems.push({ code: 'TRM-CRWN', category: 'Trim', description: 'Install crown molding', qty: project.crown_molding_install_lf, unit: 'LF', rate: project.crown_molding_rate, total: (project.crown_molding_install_lf * project.crown_molding_rate).toFixed(2) });
        }

        // --- DOORS ---
        if (project.interior_door_install_qty > 0) {
            lineItems.push({ code: 'DR-INT', category: 'Doors', description: `Install interior door - ${project.interior_door_type}`, qty: project.interior_door_install_qty, unit: 'EA', rate: project.interior_door_cost_ea, total: (project.interior_door_install_qty * project.interior_door_cost_ea).toFixed(2) });
        }
        if (project.exterior_door_install_qty > 0) {
            lineItems.push({ code: 'DR-EXT', category: 'Doors', description: 'Install exterior door', qty: project.exterior_door_install_qty, unit: 'EA', rate: project.exterior_door_cost_ea, total: (project.exterior_door_install_qty * project.exterior_door_cost_ea).toFixed(2) });
        }

        // --- FLOORING ---
        if (project.carpet_install_sqft > 0) {
            lineItems.push({ code: 'FLR-CRPT', category: 'Flooring', description: `Install carpet - ${project.carpet_type}`, qty: project.carpet_install_sqft, unit: 'SF', rate: project.carpet_rate, total: (project.carpet_install_sqft * project.carpet_rate).toFixed(2) });
        }
        if (project.pad_install_sqft > 0) {
            lineItems.push({ code: 'FLR-PAD', category: 'Flooring', description: `Install pad - ${project.pad_type}`, qty: project.pad_install_sqft, unit: 'SF', rate: project.pad_rate, total: (project.pad_install_sqft * project.pad_rate).toFixed(2) });
        }
        if (project.tile_install_sqft > 0) {
            lineItems.push({ code: 'FLR-TILE', category: 'Flooring', description: `Install tile - ${project.tile_type} ${project.tile_size}`, qty: project.tile_install_sqft, unit: 'SF', rate: project.tile_rate, total: (project.tile_install_sqft * project.tile_rate).toFixed(2) });
        }
        if (project.hardwood_install_sqft > 0) {
            lineItems.push({ code: 'FLR-HDWD', category: 'Flooring', description: `Install hardwood - ${project.hardwood_type}`, qty: project.hardwood_install_sqft, unit: 'SF', rate: project.hardwood_rate, total: (project.hardwood_install_sqft * project.hardwood_rate).toFixed(2) });
        }
        if (project.laminate_install_sqft > 0) {
            lineItems.push({ code: 'FLR-LAM', category: 'Flooring', description: `Install laminate - ${project.laminate_type}`, qty: project.laminate_install_sqft, unit: 'SF', rate: project.laminate_rate, total: (project.laminate_install_sqft * project.laminate_rate).toFixed(2) });
        }
        if (project.vinyl_install_sqft > 0) {
            lineItems.push({ code: 'FLR-VNL', category: 'Flooring', description: `Install vinyl - ${project.vinyl_type}`, qty: project.vinyl_install_sqft, unit: 'SF', rate: project.vinyl_rate, total: (project.vinyl_install_sqft * project.vinyl_rate).toFixed(2) });
        }

        // --- CABINETRY ---
        if (project.base_cabinets_install_lf > 0) {
            lineItems.push({ code: 'CAB-BASE', category: 'Cabinetry', description: `Install base cabinets - ${project.base_cabinet_type}`, qty: project.base_cabinets_install_lf, unit: 'LF', rate: project.base_cabinet_cost_lf, total: (project.base_cabinets_install_lf * project.base_cabinet_cost_lf).toFixed(2) });
        }
        if (project.upper_cabinets_install_lf > 0) {
            lineItems.push({ code: 'CAB-UPPR', category: 'Cabinetry', description: 'Install upper cabinets', qty: project.upper_cabinets_install_lf, unit: 'LF', rate: project.upper_cabinet_cost_lf, total: (project.upper_cabinets_install_lf * project.upper_cabinet_cost_lf).toFixed(2) });
        }
        if (project.countertop_install_lf > 0) {
            lineItems.push({ code: 'CAB-CNTR', category: 'Cabinetry', description: `Install countertop - ${project.countertop_material}`, qty: project.countertop_install_lf, unit: 'LF', rate: project.countertop_cost_lf, total: (project.countertop_install_lf * project.countertop_cost_lf).toFixed(2) });
        }

        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.total), 0);
        const overhead = subtotal * (project.overhead_percentage / 100);
        const profit = (subtotal + overhead) * (project.profit_margin_percentage / 100);
        const total = subtotal + overhead + profit;

        res.json({
            project_number: project.project_number,
            claim_number: project.claim_number,
            xactimate_estimate: project.xactimate_estimate_number,
            line_items: lineItems,
            summary: {
                subtotal: subtotal.toFixed(2),
                overhead: `${project.overhead_percentage}% = ${overhead.toFixed(2)}`,
                profit: `${project.profit_margin_percentage}% = ${profit.toFixed(2)}`,
                total: total.toFixed(2),
                change_orders: (project.change_orders_total || 0).toFixed(2),
                grand_total: (total + (project.change_orders_total || 0)).toFixed(2)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// ADD DAILY LOG
// =========================
router.post('/:id/daily-log', async (req, res) => {
    try {
        const {
            log_date,
            technician_name,
            work_performed,
            crew_members,
            hours_worked,
            weather_conditions,
            site_conditions,
            issues_encountered,
            next_visit_planned,
            notes
        } = req.body;

        const result = await db.run(`
            INSERT INTO daily_project_logs (
                project_id, project_type, log_date, technician_name, work_performed,
                crew_members, hours_worked, weather_conditions, site_conditions,
                issues_encountered, next_visit_planned, notes
            ) VALUES (?, 'reconstruction', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.params.id,
            log_date || new Date().toISOString().split('T')[0],
            technician_name,
            work_performed,
            JSON.stringify(crew_members || []),
            hours_worked || 0,
            weather_conditions,
            site_conditions,
            issues_encountered,
            next_visit_planned,
            notes
        ]);

        const newLog = await db.get('SELECT * FROM daily_project_logs WHERE id = ?', result.lastID);
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
