-- History table for tracking changes to inference_instances
-- This table maintains a complete audit trail of all operations performed on instances

CREATE TABLE inference_instances_history(
    -- History metadata
    history_id SERIAL NOT NULL,
    original_id integer NOT NULL,
    operation_type varchar(20) NOT NULL,
    operation_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Snapshot of InferenceInstance fields at time of operation
    -- Core identification
    name varchar(255) NOT NULL,
    model_name varchar(255) NOT NULL,
    cluster_name varchar(255) NOT NULL,
    
    -- Resource allocation
    pp integer,
    cp integer,
    tp integer,
    n_workers integer,
    replicas integer,
    
    -- Priority and description
    priorities json,
    "desc" varchar(1024),
    
    -- Video processing options
    separate_video_encode boolean,
    separate_video_decode boolean,
    separate_t5_encode boolean,
    
    -- Storage configuration
    vae_store_type varchar(50),
    t5_store_type varchar(50),
    
    -- Performance options
    enable_cuda_graph boolean,
    task_concurrency integer,
    celery_task_concurrency integer,
    
    -- Status and metadata
    status varchar(50),
    
    -- Timestamps (from original instance)
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    
    -- Image and deployment
    image_tag varchar(50),
    nonce varchar(50),
    checkpoint_path varchar,
    
    -- Ephemeral instance configuration
    ephemeral boolean,
    ephemeral_to varchar,
    ephemeral_from varchar,
    ephemeral_min_period_seconds integer,
    
    -- Environment and configuration
    envs json,
    model_version varchar,
    pipeline_mode varchar,
    
    -- Mode flags
    quant_mode boolean,
    distill_mode boolean,
    m405_mode boolean,
    
    -- Video configuration
    fps integer,
    
    PRIMARY KEY(history_id)
);

-- Indexes for efficient querying
CREATE INDEX inference_instances_history_original_id_idx ON inference_instances_history USING btree (original_id);
CREATE INDEX inference_instances_history_operation_timestamp_idx ON inference_instances_history USING btree (operation_timestamp DESC);
CREATE INDEX inference_instances_history_operation_type_idx ON inference_instances_history USING btree (operation_type);
CREATE INDEX inference_instances_history_name_idx ON inference_instances_history USING btree (name);

-- Composite index for common queries
CREATE INDEX inference_instances_history_original_id_timestamp_idx ON inference_instances_history USING btree (original_id, operation_timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE inference_instances_history IS 'Audit trail table for tracking all changes to inference_instances';
COMMENT ON COLUMN inference_instances_history.history_id IS 'Unique identifier for each history record';
COMMENT ON COLUMN inference_instances_history.original_id IS 'ID of the original instance in inference_instances table';
COMMENT ON COLUMN inference_instances_history.operation_type IS 'Type of operation: create, update, delete, rollback';
COMMENT ON COLUMN inference_instances_history.operation_timestamp IS 'When the operation was performed';
COMMENT ON COLUMN inference_instances_history.priorities IS 'JSON field containing priority information';
COMMENT ON COLUMN inference_instances_history.envs IS 'JSON field containing environment variables';