import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

export type CategoryItem = {
  text: string;
  participant: string;
};

export type EngagementInfo = {
  company_name: string | null;
  leader_name: string | null;
  financial_year_end: string | null;
};

export type InputSummaryPdfProps = {
  engagementId: string;
  engagement: EngagementInfo | null;
  startItems: CategoryItem[];
  stopItems: CategoryItem[];
  keepItems: CategoryItem[];
  strengthsItems: CategoryItem[];
  weaknessesItems: CategoryItem[];
  opportunitiesItems: CategoryItem[];
  threatsItems: CategoryItem[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 11,
    marginBottom: 2,
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  groupColumn: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 11,
    marginBottom: 2,
  },
  bullet: {
    fontSize: 9,
    marginBottom: 2,
  },
});

type PdfCategoryProps = {
  title: string;
  items: CategoryItem[];
};

const PdfCategory: React.FC<PdfCategoryProps> = ({ title, items }) => (
  <View style={{ marginTop: 4, marginBottom: 4 }}>
    <Text style={styles.categoryTitle}>{title}</Text>
    {items.length === 0 ? (
      <Text style={styles.bullet}>• No responses yet.</Text>
    ) : (
      items.map((item, idx) => (
        <Text key={idx} style={styles.bullet}>
          • {item.text} — {item.participant}
        </Text>
      ))
    )}
  </View>
);

export const InputSummaryPdf: React.FC<InputSummaryPdfProps> = ({
  engagementId,
  engagement,
  startItems,
  stopItems,
  keepItems,
  strengthsItems,
  weaknessesItems,
  opportunitiesItems,
  threatsItems,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>
          Strategic Planning – Phase I Input Summary
        </Text>

        {engagement && (
          <>
            {engagement.company_name && (
              <Text style={styles.subheading}>
                Company: {engagement.company_name}
              </Text>
            )}
            {engagement.leader_name && (
              <Text style={styles.subheading}>
                Leader: {engagement.leader_name}
              </Text>
            )}
            {engagement.financial_year_end && (
              <Text style={styles.subheading}>
                FY End: {engagement.financial_year_end}
              </Text>
            )}
          </>
        )}

        <Text style={styles.subheading}>
          Engagement ID: {engagementId}
        </Text>
      </View>

      {/* SSK Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Start / Stop / Keep</Text>

        <View style={styles.groupRow}>
          <View style={styles.groupColumn}>
            <PdfCategory title="Start" items={startItems} />
          </View>
          <View style={styles.groupColumn}>
            <PdfCategory title="Stop" items={stopItems} />
          </View>
          <View style={styles.groupColumn}>
            <PdfCategory title="Keep" items={keepItems} />
          </View>
        </View>
      </View>

      {/* SWOT Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SWOT</Text>

        <View style={styles.groupRow}>
          <View style={styles.groupColumn}>
            <PdfCategory title="Strengths" items={strengthsItems} />
          </View>
          <View style={styles.groupColumn}>
            <PdfCategory title="Weaknesses" items={weaknessesItems} />
          </View>
        </View>

        <View style={styles.groupRow}>
          <View style={styles.groupColumn}>
            <PdfCategory title="Opportunities" items={opportunitiesItems} />
          </View>
          <View style={styles.groupColumn}>
            <PdfCategory title="Threats" items={threatsItems} />
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default InputSummaryPdf;
