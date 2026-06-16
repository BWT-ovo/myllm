import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Spin, Tag, Space, Empty, Button, Row, Col } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import * as d3 from 'd3';

const { Title, Text } = Typography;

interface GraphNode {
  id: string;
  title: string;
  depth: number;
  tags: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#f5222d', '#2f54eb'];

export default function KnowledgeMapPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => { setData(getFallbackGraph()); setLoading(false); }, []);

  const loadGraph = () => { setData(getFallbackGraph()); };

  useEffect(() => {
    if (!data || !svgRef.current) return;
    drawGraph(data);
  }, [data]);

  const drawGraph = (graphData: GraphData) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current!.clientWidth || 800;
    const height = 620;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Prepare data for D3
    const nodes = graphData.nodes.map((n) => ({ ...n }));
    const edges = graphData.edges
      .map((e) => {
        const source = nodes.find((n) => n.id === e.source);
        const target = nodes.find((n) => n.id === e.target);
        if (!source || !target) return null;
        return { ...e, source, target };
      })
      .filter(Boolean) as Array<{ source: typeof nodes[0]; target: typeof nodes[0]; relation: string }>;

    // Force simulation — constrained to viewport
    const simulation: any = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges as any).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .force('boundary', () => {
        const r = 5;
        for (const node of nodes as any[]) {
          node.x = Math.max(r, Math.min(width - r, node.x));
          node.y = Math.max(r, Math.min(height - r, node.y));
        }
      });

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 32)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw edges
    const link = svg.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (_e: any, d: any) => setSelectedNode(d))
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any);

    // Node circles
    nodeGroup.append('circle')
      .attr('r', (d) => 24 + (3 - d.depth) * 4)
      .attr('fill', (d) => COLORS[d.depth % COLORS.length])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Node labels
    nodeGroup.append('text')
      .text((d) => d.title.length > 6 ? d.title.slice(0, 6) + '…' : d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', '#fff')
      .attr('font-size', (d) => 10 + (3 - d.depth) * 1.5)
      .attr('font-weight', 'bold');

    // Edge labels
    svg.append('g')
      .selectAll('text')
      .data(edges)
      .join('text')
      .text((d) => d.relation === 'prerequisite_of' ? '前置' : '关联')
      .attr('font-size', 9)
      .attr('fill', '#999')
      .attr('text-anchor', 'middle');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🗺️ 知识图谱</Title>
          <Text type="secondary">「C++面向对象程序设计」知识点关联关系 · 可拖拽交互</Text>
        </div>
        <Space>
          {selectedNode && (
            <Tag color="blue" style={{ padding: '4px 12px' }}>
              选中: {selectedNode.title}
            </Tag>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadGraph}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={selectedNode ? 18 : 24}>
          <Card styles={{ body: { padding: 8 } }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
            ) : data ? (
              <svg ref={svgRef} style={{ width: '100%', height: 620, borderRadius: 8, overflow: 'hidden' }} />
            ) : (
              <Empty description="暂无知识图谱数据" />
            )}
          </Card>
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Text type="secondary">💡 拖拽节点移动 · 点击节点查看详情 · 箭头方向表示前置依赖关系</Text>
          </div>
        </Col>

        {selectedNode && (
          <Col xs={24} lg={6}>
            <Card title="📋 节点详情" size="small">
              <Space direction="vertical">
                <div><Text strong>名称: </Text><Text>{selectedNode.title}</Text></div>
                <div><Text strong>层级: </Text><Tag>{selectedNode.depth}</Tag></div>
                <div>
                  <Text strong>标签: </Text>
                  <Space wrap size={4}>
                    {selectedNode.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}

function getFallbackGraph(): GraphData {
  return {
    nodes: [
      { id: 'cpp-basics', title: 'C++基础', depth: 0, tags: ['基础', '语法'] },
      { id: 'class-object', title: '类与对象', depth: 1, tags: ['类', '对象', '封装'] },
      { id: 'inheritance', title: '继承与派生', depth: 2, tags: ['继承', '派生', '重写'] },
      { id: 'polymorphism', title: '多态与虚函数', depth: 3, tags: ['多态', '虚函数', '抽象类'] },
      { id: 'operator-overload', title: '运算符重载', depth: 2, tags: ['运算符', '重载'] },
      { id: 'templates', title: '模板与泛型', depth: 2, tags: ['模板', '泛型'] },
      { id: 'stl', title: 'STL标准库', depth: 2, tags: ['STL', '容器', '算法'] },
      { id: 'exceptions', title: '异常处理', depth: 1, tags: ['异常', 'try-catch'] },
      { id: 'file-io', title: '文件IO与流', depth: 1, tags: ['文件', '流', 'IO'] },
      { id: 'design-patterns', title: '设计模式', depth: 3, tags: ['设计模式', '架构'] },
    ],
    edges: [
      { source: 'cpp-basics', target: 'class-object', relation: 'prerequisite_of' },
      { source: 'class-object', target: 'inheritance', relation: 'prerequisite_of' },
      { source: 'inheritance', target: 'polymorphism', relation: 'prerequisite_of' },
      { source: 'class-object', target: 'operator-overload', relation: 'prerequisite_of' },
      { source: 'class-object', target: 'templates', relation: 'related_to' },
      { source: 'templates', target: 'stl', relation: 'prerequisite_of' },
      { source: 'class-object', target: 'exceptions', relation: 'related_to' },
      { source: 'cpp-basics', target: 'file-io', relation: 'related_to' },
      { source: 'polymorphism', target: 'design-patterns', relation: 'prerequisite_of' },
      { source: 'stl', target: 'design-patterns', relation: 'related_to' },
    ],
  };
}
